export class CircularBuffer {
  private static instance: CircularBuffer;

  memory: any;
  head: number;
  tail: number;
  isFull: Boolean;

  constructor(size: number) {
    this.memory = new Array(size);
    this.head = 0;
    this.tail = 0;
    this.isFull = false;
  }

  static getInstance(): CircularBuffer {
    if (!CircularBuffer.instance) {
      CircularBuffer.instance = new CircularBuffer(20);
    }
    return CircularBuffer.instance;
  }

  read() {
    if (this.head === this.tail && !this.isFull) {
      return "NO DATA";
    } else {
      this.tail = this.next(this.tail);
      this.isFull = false;
      return this.memory[this.tail];
    }
  }

  write(data: any) {
    if (this.isFull) {
      //   console.log("Buffer is Full");
    } else {
      this.head = this.next(this.head);
      this.memory[this.head] = data;
      //   console.log("Write", this.memory[this.head]);
      if (this.head === this.tail) {
        this.isFull = true;
      }
    }
  }

  next(currentIdx: number) {
    let nextIdx = currentIdx + 1;
    if (nextIdx === this.memory.length) {
      this.isFull = true;
      return 0;
    } else {
      return nextIdx;
    }
  }
}
