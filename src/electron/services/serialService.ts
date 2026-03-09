import { SerialPort } from 'serialport';

const BAUD_RATE = 9600;
const INTERVAL_MS = 7000;

let port: SerialPort | null = null;
let currentResolve: (() => void) | null = null;
let isDispensing = false;
const messageQueue: string[] = [];

function processQueue() {
    if (isDispensing || messageQueue.length === 0) {
        if (messageQueue.length === 0 && currentResolve) {
            currentResolve();
            currentResolve = null;
        }
        return;
    }
    isDispensing = true;

    const intervalId = setInterval(() => {
        if (messageQueue.length === 0) {
            console.log("[SerialService] Finished sending all items.");
            clearInterval(intervalId);
            isDispensing = false;
            if (currentResolve) {
                currentResolve();
                currentResolve = null;
            }
            return;
        }

        const letterCmd = messageQueue.shift()!;
        console.log(`[SerialService] Sending letter command: ${letterCmd}`);
        port?.write(`${letterCmd}\n`, (err) => {
            if (err) {
                console.error('[SerialService] Error on write:', err.message);
            }
        });
    }, INTERVAL_MS);
}


export async function initSerial(): Promise<void> {
    const portPath = process.env.SERIAL_PORT;
    console.log(`[SerialService] Attempting to open serial port: ${portPath}`);

    return new Promise((resolve) => {
        port = new SerialPort({
            path: portPath || '/dev/ttyACM0',
            baudRate: BAUD_RATE,
            autoOpen: true
        });

        port.on('open', () => {
            console.log(`[SerialService] Port ${portPath} opened successfully.`);
            resolve();
        });

        port.on('error', (err) => {
            console.error(`[SerialService] Error: ${err.message}`);
            resolve();
        });
    });
}


export function dispenseItems(items: string[]): Promise<void> {
    return new Promise((resolve) => {
        if (!port || !port.isOpen) {
            console.error("[SerialService] Cannot dispense! Port is not connected.");
            resolve();
            return;
        }

        console.log(`[SerialService] Queueing commands: ${JSON.stringify(items)}`);
        messageQueue.push(...items);
        currentResolve = resolve;
        processQueue();
    });
}

