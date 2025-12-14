import { EventEmitter } from 'events';
import net from 'net';

export type IncomingMessage =
    | { type: 'LeafTestStarted'; testId: string }
    | { type: 'LeafTestCompleted'; testId: string; result: 'passed' | 'failed' | 'skipped'; duration: number }
    | { type: 'CompositeTestStarted'; testId: string }
    | { type: 'CompositeTestCompleted'; testId: string; duration: number }
    | { type: 'SuiteStarted' }
    | { type: 'SuiteCompleted' };

export type OutgoingMessage =
    | { type: 'ScheduleTest'; id: string } //
    | { type: 'StartSuite' };

export class PipePort extends EventEmitter {
    private incomingServer: net.Server;
    private outgoingServer: net.Server;
    private outgoingSocket: net.Socket | null = null;
    private incomingBuffer = '';

    constructor(
        private readPipeName: string,
        private writePipeName: string
    ) {
        super();

        this.incomingServer = net.createServer((socket) => {
            socket.on('data', (chunk) => this.handleIncomingChunk(chunk));
            socket.on('error', (err) => this.emit('error', err));
        });

        this.incomingServer.listen(this.getPipePath(this.readPipeName), () => {});

        this.outgoingServer = net.createServer((socket) => {
            this.outgoingSocket = socket;

            this.emit('ready');

            socket.on('error', (err) => this.emit('error', err));
            socket.on('close', () => {
                this.outgoingSocket = null;
            });
        });

        this.outgoingServer.listen(this.getPipePath(this.writePipeName), () => {});
    }

    private handleIncomingChunk(chunk: Buffer) {
        this.incomingBuffer += chunk.toString();
        const parts = this.incomingBuffer.split('\n');
        this.incomingBuffer = parts.pop()!; // incomplete chunk remains

        for (const part of parts) {
            if (!part.trim()) continue;
            try {
                const message: IncomingMessage = JSON.parse(part);
                this.emit('message', message);

                switch (message.type) {
                    case 'SuiteCompleted':
                        this.emit('done', message);
                        break;
                    default:
                        this.emit('progress', message);
                }
            } catch (err) {
                this.emit('error', err);
            }
        }
    }

    public send(message: OutgoingMessage) {
        if (!this.outgoingSocket || this.outgoingSocket.destroyed) {
            this.emit('error', new Error('No client connected to outgoing pipe'));
            return;
        }

        const data = typeof message === 'string' ? message : JSON.stringify(message);
        this.outgoingSocket.write(data + '\n');
    }

    public close() {
        this.incomingServer.close();
        this.outgoingServer.close();
        if (this.outgoingSocket) {
            this.outgoingSocket.end();
            this.outgoingSocket.destroy();
        }
        this.removeAllListeners();
        this.emit('closed');
    }

    private getPipePath(pipeName: string) {
        // Windows Named Pipe path
        return `\\\\.\\pipe\\${pipeName}`;
    }
}
