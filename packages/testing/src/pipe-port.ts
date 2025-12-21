import * as json from '@keyslam/json';
import { IncomingMessage, OutgoingMessage, Port } from './port';

ffi.cdef(`
typedef void* HANDLE;
typedef unsigned long DWORD;
typedef int BOOL;

HANDLE CreateFileA(
    const char* lpFileName,
    DWORD dwDesiredAccess,
    DWORD dwShareMode,
    void* lpSecurityAttributes,
    DWORD dwCreationDisposition,
    DWORD dwFlagsAndAttributes,
    HANDLE hTemplateFile
);

BOOL ReadFile(
    HANDLE hFile,
    void* lpBuffer,
    DWORD nNumberOfBytesToRead,
    DWORD* lpNumberOfBytesRead,
    void* lpOverlapped
);

BOOL WriteFile(
    HANDLE hFile,
    const void* lpBuffer,
    DWORD nNumberOfBytesToWrite,
    DWORD* lpNumberOfBytesWritten,
    void* lpOverlapped
);

BOOL CloseHandle(HANDLE hObject);

static const int GENERIC_READ = 0x80000000;
static const int GENERIC_WRITE = 0x40000000;
static const int OPEN_EXISTING = 3;
`);

type Handle = {};

type FFI = {
    C: {
        CreateFileA: (
            this: void,
            lpFileName: string,
            dwDesiredAccess: number,
            dwShareMode: number,
            lpSecurityAttributes: any,
            dwCreationDisposition: number,
            dwFlagsAndAttributes: number,
            hTemplateFile: any
        ) => Handle;

        ReadFile: (
            this: void,
            hFile: Handle,
            lpBuffer: any,
            nNumberOfBytesToRead: number,
            lpNumberOfBytesRead: any,
            lpOverlapped: any
        ) => number;

        WriteFile: (
            this: void,
            hFile: Handle,
            lpBuffer: any,
            nNumberOfBytesToWrite: number,
            lpNumberOfBytesWritten: any,
            lpOverlapped: any
        ) => number;

        CloseHandle: (this: void, hObject: Handle) => number;

        GENERIC_READ: number;
        GENERIC_WRITE: number;
        OPEN_EXISTING: number;
    };

    cast: (this: void, type: string, value: any) => any;
    new: (this: void, type: string, size?: number) => any;
    string: (this: void, buffer: any, length: number) => string;
};

const FFI = ffi as unknown as FFI;

export class PipePort implements Port {
    private readonly readHandle: Handle;
    private readonly writeHandle: Handle;

    private leftover = '';

    constructor(readPipeName: string, writePipeName: string) {
        this.readHandle = this.createHandle(readPipeName, FFI.C.GENERIC_READ);
        this.writeHandle = this.createHandle(writePipeName, FFI.C.GENERIC_WRITE);
    }

    public read(): IncomingMessage {
        // 1. Keep reading until we have at least one full message
        while (!this.leftover.includes('\n')) {
            const buffer = FFI.new('char[?]', 1024);
            const bytesRead = FFI.new('DWORD[1]');

            if (FFI.C.ReadFile(this.readHandle, buffer, 1024, bytesRead, undefined) === 0) {
                throw new Error('Failed to read from pipe');
            }

            const chunk = FFI.string(buffer, bytesRead[0]);
            this.leftover += chunk; // append chunk
        }

        // 2. Split into messages
        const index = this.leftover.indexOf('\n');
        const rawMessage = this.leftover.slice(0, index);
        this.leftover = this.leftover.slice(index + 1); // save remainder

        return json.decode(rawMessage) as IncomingMessage;
    }

    public send(message: OutgoingMessage): void {
        const serializedMessage = `${json.encode(message)}\n`;

        const buffer = FFI.cast('const char*', serializedMessage);
        const bytesWritten = FFI.new('DWORD[1]');

        if (FFI.C.WriteFile(this.writeHandle, buffer, serializedMessage.length, bytesWritten, undefined) === 0) {
            throw new Error('Failed to write to pipe');
        }
    }

    public close(): void {
        FFI.C.CloseHandle(this.readHandle);
        FFI.C.CloseHandle(this.writeHandle);
    }

    private createHandle(pipeName: string, accessMode: number): Handle {
        const fullPipeName = `\\\\.\\pipe\\${pipeName}`;

        const handle = FFI.C.CreateFileA(fullPipeName, accessMode, 0, undefined, FFI.C.OPEN_EXISTING, 0, undefined);
        if (handle === FFI.cast('HANDLE', -1)) {
            throw new Error(`Failed to open pipe: ${pipeName}`);
        }

        return handle;
    }
}
