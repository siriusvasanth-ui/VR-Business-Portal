'use strict';

/**
 * Generic JSON-file repository.
 *
 * Provides the standard collection operations (findAll / findById / create /
 * update / delete) backed by a single JSON file on disk. Concrete repositories
 * (accounts, groups) extend this class and add domain-specific finders.
 *
 * IMPORTANT ARCHITECTURAL RULE
 * ---------------------------
 * This class is the ONLY place in the backend that touches the file system for
 * business data. Services depend on the abstract shape of these methods, never
 * on files. Replacing this with a JDBC / MySQL / PostgreSQL implementation is
 * therefore a matter of providing a class with the same method surface — see
 * docs/JDBC_MIGRATION.md and docs/REPOSITORY_PATTERN.md.
 *
 * Writes are serialised through a per-instance promise chain so concurrent
 * requests cannot interleave and corrupt the file.
 */

const fs = require('fs').promises;
const path = require('path');

class JsonRepository {
  /**
   * @param {string} fileName  file name inside the data directory, e.g. "accounts.json"
   * @param {string} [idField] primary-key field name (default "id")
   */
  constructor(fileName, idField = 'id') {
    this.filePath = path.join(__dirname, '..', 'data', fileName);
    this.idField = idField;
    // Serialises write operations to avoid lost updates / corrupt files.
    this._writeQueue = Promise.resolve();
  }

  /** Reads and parses the backing file. Returns [] if it does not exist yet. */
  async _read() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return raw.trim() ? JSON.parse(raw) : [];
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  /** Serialised, atomic-ish write (write to temp file then rename). */
  _write(records) {
    this._writeQueue = this._writeQueue.then(async () => {
      const tmp = `${this.filePath}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(records, null, 2), 'utf-8');
      await fs.rename(tmp, this.filePath);
    });
    return this._writeQueue;
  }

  /** @returns {Promise<Array>} every record in the collection */
  async findAll() {
    return this._read();
  }

  /** @returns {Promise<object|null>} the record whose id matches, or null */
  async findById(id) {
    const records = await this._read();
    return records.find((r) => r[this.idField] === id) || null;
  }

  /**
   * Finds the first record matching a predicate function.
   * @param {(record:object)=>boolean} predicate
   */
  async findOne(predicate) {
    const records = await this._read();
    return records.find(predicate) || null;
  }

  /**
   * Finds every record matching a predicate function.
   * @param {(record:object)=>boolean} predicate
   */
  async findMany(predicate) {
    const records = await this._read();
    return records.filter(predicate);
  }

  /** Inserts a new record and returns it. */
  async create(record) {
    const records = await this._read();
    records.push(record);
    await this._write(records);
    return record;
  }

  /**
   * Replaces the fields of an existing record (shallow merge) and returns the
   * updated record, or null when the id does not exist.
   */
  async update(id, changes) {
    const records = await this._read();
    const idx = records.findIndex((r) => r[this.idField] === id);
    if (idx === -1) return null;
    records[idx] = { ...records[idx], ...changes, [this.idField]: records[idx][this.idField] };
    await this._write(records);
    return records[idx];
  }

  /** Deletes a record by id. Returns true when something was removed. */
  async delete(id) {
    const records = await this._read();
    const next = records.filter((r) => r[this.idField] !== id);
    if (next.length === records.length) return false;
    await this._write(next);
    return true;
  }
}

module.exports = JsonRepository;
