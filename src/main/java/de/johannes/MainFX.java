package de.johannes;

import com.fazecast.jSerialComm.SerialPort;
import de.johannes.cnc.CNC;
import javafx.application.Application;
import javafx.concurrent.Worker;
import javafx.scene.Scene;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

import java.util.Objects;

public class MainFX extends Application {

    private String escapeJs(String s) {
        return "'" + s.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "") + "'";
    }

    @Override
    public void start(Stage stage) throws Exception {
        WebView webView = new WebView();
        WebEngine engine = webView.getEngine();

        CNC cnc = new CNC(engine, stage);
//        cnc.connect("/dev/ttyUSB0", 115200);

        engine.getLoadWorker().stateProperty().addListener((obs, old, state) -> {
            if (state == Worker.State.SUCCEEDED) {
                JSObject window = (JSObject) engine.executeScript("window");
                window.setMember("cnc", cnc);
            }
        });

        engine.setOnAlert(event -> {
            System.out.println("JS alert: " + event.getData());
        });

        engine.load(Objects.requireNonNull(getClass().getResource("/web/index.html")).toExternalForm());
        stage.setScene(new Scene(webView, 1200, 800));
        stage.setTitle("J-CNC");
        stage.setResizable(true);
        stage.show();

        stage.setOnCloseRequest(e -> {
            cnc.disconnect();
            System.exit(0);
        });
    }

    static void main(String[] args) {
        launch(args);
    }
}