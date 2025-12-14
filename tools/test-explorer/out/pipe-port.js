"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipePort = void 0;
const events_1 = require("events");
const net_1 = __importDefault(require("net"));
class PipePort extends events_1.EventEmitter {
    readPipeName;
    writePipeName;
    incomingServer;
    outgoingServer;
    outgoingSocket = null;
    incomingBuffer = '';
    constructor(readPipeName, writePipeName) {
        super();
        this.readPipeName = readPipeName;
        this.writePipeName = writePipeName;
        this.incomingServer = net_1.default.createServer((socket) => {
            socket.on('data', (chunk) => this.handleIncomingChunk(chunk));
            socket.on('error', (err) => this.emit('error', err));
        });
        this.incomingServer.listen(this.getPipePath(this.readPipeName), () => { });
        this.outgoingServer = net_1.default.createServer((socket) => {
            this.outgoingSocket = socket;
            this.emit('ready');
            socket.on('error', (err) => this.emit('error', err));
            socket.on('close', () => {
                this.outgoingSocket = null;
            });
        });
        this.outgoingServer.listen(this.getPipePath(this.writePipeName), () => { });
    }
    handleIncomingChunk(chunk) {
        this.incomingBuffer += chunk.toString();
        const parts = this.incomingBuffer.split('\n');
        this.incomingBuffer = parts.pop(); // incomplete chunk remains
        for (const part of parts) {
            if (!part.trim())
                continue;
            try {
                const message = JSON.parse(part);
                this.emit('message', message);
                switch (message.type) {
                    case 'SuiteCompleted':
                        this.emit('done', message);
                        break;
                    default:
                        this.emit('progress', message);
                }
            }
            catch (err) {
                this.emit('error', err);
            }
        }
    }
    send(message) {
        if (!this.outgoingSocket || this.outgoingSocket.destroyed) {
            this.emit('error', new Error('No client connected to outgoing pipe'));
            return;
        }
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        this.outgoingSocket.write(data + '\n');
    }
    close() {
        this.incomingServer.close();
        this.outgoingServer.close();
        if (this.outgoingSocket) {
            this.outgoingSocket.end();
            this.outgoingSocket.destroy();
        }
        this.removeAllListeners();
        this.emit('closed');
    }
    getPipePath(pipeName) {
        // Windows Named Pipe path
        return `\\\\.\\pipe\\${pipeName}`;
    }
}
exports.PipePort = PipePort;
//# sourceMappingURL=pipe-port.js.map