package de.johannes.cnc.util;

import com.fazecast.jSerialComm.SerialPort;

import java.io.*;
import java.util.function.Consumer;

public class CNCConsole implements Closeable {

    private final SerialPort        serialPort;
    private final PrintWriter       writer;
    private final BufferedReader reader;
    private final Object            lock = new Object();

    private Consumer<String> onResponse = line -> {};

    public CNCConsole(SerialPort port) {
        this.serialPort = port;
        if (!port.isOpen()) {
            throw new RuntimeException("Port must be open before being sent to CNC-Console");
        }
        this.writer = new PrintWriter(port.getOutputStream());
        this.reader = new BufferedReader(new InputStreamReader(port.getInputStream()));
    }

    public void setOnResponse(Consumer<String> callback) {
        this.onResponse = callback;
    }

    public void sendLine(String gcode) {
        Thread.ofVirtual().start(() -> {
            try {
                if (gcode == null) return;
                String trimmed = gcode.trim();
                if (trimmed.isEmpty() || trimmed.startsWith(";")) return;

                synchronized (lock) {
                    writer.println(trimmed);
                    writer.flush();

                    String response;
                    while ((response = reader.readLine()) != null) {
                        if (response.startsWith("ok")) {
                            onResponse.accept(trimmed + " >> ok");
                            break;
                        } else if (response.startsWith("error")) {
                            onResponse.accept(trimmed + " >> " + response);
                            break;
                        } else {
                            onResponse.accept(response);
                        }
                    }
                }
            } catch (Throwable t) {
                t.printStackTrace();
            }
        });
    }

    public void close() {
        try {
            writer.close();
            reader.close();
            serialPort.closePort();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}