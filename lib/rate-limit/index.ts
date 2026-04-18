// lib/rate-limiter/storage.ts

interface RateLimitRecord {
	count: number;
	resetTime: number;
}

class RateLimitStorage {
	private store: Map<string, RateLimitRecord> = new Map();

	// Get request count for a key (IP address)
	get(key: string): RateLimitRecord | undefined {
		const record = this.store.get(key);

		// If record exists but expired, delete it automatically
		if (record && Date.now() > record.resetTime) {
			this.store.delete(key);
			return undefined;
		}

		return record;
	}

	// Increment request count
	increment(
		key: string,
		windowMs: number,
	): { count: number; resetTime: number } {
		const now = Date.now();
		let record = this.get(key); // This auto-deletes expired records

		// If no valid record, create new one
		if (!record) {
			const newRecord = {
				count: 1,
				resetTime: now + windowMs,
			};
			this.store.set(key, newRecord);
			return { count: 1, resetTime: newRecord.resetTime };
		}

		// Increment existing valid record
		record.count++;
		this.store.set(key, record);
		return { count: record.count, resetTime: record.resetTime };
	}
}

// Singleton instance
export const rateLimitStorage = new RateLimitStorage();
