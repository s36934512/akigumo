export interface SseConnection {
	send(input: { id?: string; event?: string; data: string }): Promise<void>;

	heartbeat(): Promise<void>;

	isClosed(): boolean;

	close(): void;
}
