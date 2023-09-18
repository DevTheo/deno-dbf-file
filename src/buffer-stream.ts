import {Buffer} from "io";

export class BufferStream {
    public static alloc(size: number) {
        return new BufferStream(size);
    }

    public static Empty() {
        return new BufferStream(0);
    }

    public static concat(buffers: BufferStream[]) {
        const size = buffers.reduce((a, b) => a + b.buffer.length, 0);

        const result = BufferStream.alloc(size);
        let place = 0;
        buffers.forEach(buffer => {
            result.buffer.set(buffer.buffer, place);
            place += buffer.buffer.length;
        });
        return result;
    }

    public buffer: Uint8Array;
    public get length() {
        return this.buffer.length;
    }

    constructor(init: number | Uint8Array) {
        if (init instanceof Uint8Array) {
            this.buffer = init;
        } else if (init > 0) {
            this.buffer = new Uint8Array(init);
        } else {
            this.buffer = new Uint8Array();
        }
    }

    public readUInt8(pos: number) {
        const result = this.buffer.at(pos) || 0;

        return result;
    }

    public readInt16LE(pos: number) {
        let num = this.readUInt8(pos); 
        num += this.readUInt8(pos+1) << 8; 
        
        return num;    
    }

    public readUInt16BE(pos: number) {
        let num = this.readUInt8(pos) << 8; 
        num += this.readUInt8(pos+1); 
        
        return num;    
        
    }

    public readUInt32LE(pos: number) {
        let num = this.readUInt8(pos); 
        num += this.readUInt8(pos+1) << 8; 
        num += this.readUInt8(pos+2) << 16; 
        num += this.readUInt8(pos+3) << 24;
        
        return num;    
    }

    public readInt32LE(pos: number) {
        let num = this.readUInt8(pos); 
        num += this.readUInt8(pos+1) << 8; 
        num += this.readUInt8(pos+2) << 16;
        let lastBit = this.readUInt8(pos+3);
        const sign = (lastBit >= 128) ? -1 : 1;
        if(sign === -1) {
            lastBit = lastBit - 128;
        }  
        num += lastBit << 24;
        
        return num;    
    }

    public readInt32BE(pos: number) {
        let num = this.readUInt8(pos+3); 
        num += this.readUInt8(pos+2) << 8; 
        num += this.readUInt8(pos+1) << 16;
        let lastBit = this.readUInt8(pos);
        const sign = (lastBit >= 128) ? -1 : 1;
        if(sign === -1) {
            lastBit = lastBit - 128;
        }  
        num += lastBit << 24;
        
        return num;
    }

    public readUInt64LE(pos: number) {
        let num = this.readUInt8(pos); 
        num += this.readUInt8(pos+1) << 8; 
        num += this.readUInt8(pos+2) << 16; 
        num += this.readUInt8(pos+3) << 24;
        num += this.readUInt8(pos+4) << 32;
        num += this.readUInt8(pos+5) << 40;
        num += this.readUInt8(pos+6) << 48;
        num += this.readUInt8(pos+7) << 56;
        
        return num;    
    }

    public readDoubleLE(pos: number) {
        const ulong = this.readUInt64LE(pos);
        const signByte = ((ulong & 0xff00000000000000) >> 56) > 128 ? -1 : 1;
        return signByte * (ulong / 512); // This is very much a guess
    }

    public writeUInt8(value: number, offset: number) {
        this.buffer.set([value], offset);
    }

    public writeInt32LE(value: number, offset: number) {
        if(value < 0) {
            throw new Error("value cannot be less than 0");
        }

        this.buffer.set([(value & 0x000000FF),
                         (value & 0x0000ff00) >> 8, 
                         (value & 0x00ff0000) >> 16,
                         (value & 0xff000000) >> 24], offset)
    }

    public writeUInt32LE(value: number, offset: number) {
        this.writeInt32LE(value, offset);
    }

    public writeUInt16LE(num: number, offset: number) {
        this.buffer.set([(num & 0x000000FF),
                         (num & 0x0000ff00) >> 8], offset)
    }

    public writeDoubleLE(value: number, offset: number) {
        const sign = value < 0;
        if(sign) {
            value = -value;
        }
        value = value * 512;

        const buf = new Uint8Array(8);
        const lastBit = ((value & 0xff00000000000000) >> 56) + (sign ? 128 : 0);
        this.buffer.set([
            (value & 0x00000000000000ff),
            (value & 0x000000000000ff00) >> 8, 
            (value & 0x0000000000ff0000) >> 16,
            (value & 0x00000000ff000000) >> 24,
            (value & 0x000000ff00000000) >> 32,
            (value & 0x0000ff0000000000) >> 40,
            (value & 0x00ff000000000000) >> 48,            
            lastBit > 256 ? lastBit - 128 : lastBit
        ], offset)
    }

    public at(pos: number) {
        return this.buffer.at(pos) || 0;
    }

    public slice(start: number, end?: number) {
        return new BufferStream(this.buffer.slice(start, end))
    }

    public indexOf(value: number) {
        return this.buffer.indexOf(value);
    }
}