package de.johannes.cnc;

import com.fazecast.jSerialComm.SerialPort;

import java.io.Closeable;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.function.Consumer;

public class Console implements Closeable {

    private final SerialPort serialPort;
    private final PrintWriter writer;
    private final Object writeLock = new Object();

    private volatile boolean running = true;
    private Consumer<String> onResponse = line -> {};

    public Console(SerialPort port) {
        this.serialPort = port;

        if (!port.isOpen()) {
            throw new RuntimeException("Port must be open before being sent to CNC-Console");
        }

        this.writer = new PrintWriter(port.getOutputStream(), true);

        startReaderThread();
    }

    public void setOnResponse(Consumer<String> callback) {
        this.onResponse = callback != null ? callback : line -> {};
    }

    public void sendLine(String gcode) {
        if (gcode == null) return;

        String trimmed = gcode.trim();

        if (trimmed.isEmpty() || trimmed.startsWith(";")) return;

        synchronized (writeLock) {
            writer.println(trimmed);
            writer.flush();
        }
    }

    public void sendRealtime(String cmd) {
        if (cmd == null || cmd.isEmpty()) return;

        byte[] bytes = cmd.getBytes(StandardCharsets.UTF_8);

        synchronized (writeLock) {
            serialPort.writeBytes(bytes, bytes.length);
        }
    }

    private void startReaderThread() {
        Thread.ofVirtual().start(() -> {
            byte[] buffer = new byte[1024];
            StringBuilder lineBuffer = new StringBuilder();

            read(buffer, lineBuffer);
        });
    }

    private void read(byte[] buffer, StringBuilder lineBuffer) {
        while (running && serialPort.isOpen()) {
            try {
                int available = serialPort.bytesAvailable();

                if (available <= 0) {
                    Thread.sleep(10);
                    continue;
                }

                int read = serialPort.readBytes(
                        buffer,
                        Math.min(buffer.length, available)
                );

                if (read <= 0) {
                    continue;
                }

                buildString(buffer, lineBuffer, read);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
                break;
            } catch (Throwable t) {
                if (running) {
                    t.printStackTrace();
                }
                break;
            }
        }
    }

    private void buildString(byte[] buffer, StringBuilder lineBuffer, int read) {
        for (int i = 0; i < read; i++) {
            char c = (char) buffer[i];

            if (c == '\n' || c == '\r') {
                if (!lineBuffer.isEmpty()) {
                    emit(lineBuffer.toString());
                    lineBuffer.setLength(0);
                }
            } else {
                lineBuffer.append(c);
            }
        }
    }

    private void emit(String line) {
        try {
            onResponse.accept(line);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    @Override
    public void close() {
        running = false;

        try {
            writer.close();
            serialPort.closePort();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}