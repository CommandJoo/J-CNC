package de.johannes.cnc;

import com.fazecast.jSerialComm.SerialPort;

import java.util.Arrays;
import java.util.List;

public class CNC {

    private Console console;
    private SvgToGcode converter;

    public CNC() {
        this.console = null;
        this.converter = new SvgToGcode();
    }

    public Console console() {
        return console;
    }

    public SvgToGcode converter() {
        return converter;
    }

    public void connect(String path, int baudrate) {
        SerialPort port = Firmware.bindPort(path, baudrate);
        if(port == null) return;
        this.console = new Console(port);
    }

    public void disconnect() {
        this.console.close();
        this.console = null;
    }



    public PortInfo[] listPorts() {
        List<PortInfo> ports = Arrays.stream(SerialPort.getCommPorts()).map((p) -> {
            return new PortInfo(p.getSystemPortName(), p.getSystemPortPath());
        }).toList();
        return ports.toArray(PortInfo[]::new);
    }

    public static record PortInfo(String name, String path) {}
}
