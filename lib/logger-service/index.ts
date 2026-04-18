// lib/logger.ts

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const Colors = {
	RESET: "\x1b[0m",
	RED: "\x1b[31m",
	GREEN: "\x1b[32m",
	YELLOW: "\x1b[33m",
	BLUE: "\x1b[34m",
	CYAN: "\x1b[36m",
	GRAY: "\x1b[90m",
};

const LevelColor: Record<LogLevel, string> = {
	DEBUG: Colors.CYAN,
	INFO: Colors.GREEN,
	WARN: Colors.YELLOW,
	ERROR: Colors.RED,
};

export class Logger {
	private service: string;

	constructor(service: string = "APP") {
		this.service = service;
	}

	private log(level: LogLevel, message: string, context?: any) {
		const timestamp = new Date().toISOString();
		const color = LevelColor[level];

		console.log(
			`${Colors.GRAY}[${timestamp}]${Colors.RESET} ${color}[${level}]${Colors.RESET} ${Colors.CYAN}[${this.service}]${Colors.RESET} ${message}`,
			context ? context : "",
		);
	}

	debug(message: string, context?: any) {
		this.log("DEBUG", message, context);
	}

	info(message: string, context?: any) {
		this.log("INFO", message, context);
	}

	warn(message: string, context?: any) {
		this.log("WARN", message, context);
	}

	error(message: string, context?: any) {
		this.log("ERROR", message, context);
	}
}

export const logger = new Logger("EXPENSE-TRACKER");
