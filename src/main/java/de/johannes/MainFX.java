package de.johannes;

import de.johannes.cnc.SvgToGcode;
import de.johannes.cnc.Console;
import de.johannes.cnc.Firmware;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.concurrent.Worker;
import javafx.scene.Scene;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

public class MainFX extends Application {

    private Console console;

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

        this.console = null;
        SvgToGcode svg = new SvgToGcode();
        try {
            this.console = new Console(Firmware.GRBL.bindPort("/dev/ttyUSB0"));
        } catch(Exception ex) {
        }
        engine.getLoadWorker().stateProperty().addListener((obs, old, state) -> {
            if (state == Worker.State.SUCCEEDED) {
                JSObject window = (JSObject) engine.executeScript("window");
                window.setMember("gconsole", console);
                window.setMember("svg_converter", svg);



                console.setOnResponse(line -> {
                    Platform.runLater(() -> {
                        JSObject win = (JSObject) engine.executeScript("window");
                        Object fn = win.getMember("onGrblResponse");
                        if (fn != null && !"undefined".equals(fn.toString())) {
                            win.call("onGrblResponse", line);
                        }
                    });
                });
            }
        });

        engine.setOnAlert(event -> {
            System.out.println("JS alert: " + event.getData());
        });

        engine.load(getClass().getResource("/web/index.html").toExternalForm());
        stage.setScene(new Scene(webView, 1200, 800));
        stage.show();

        stage.setOnCloseRequest(e -> {
            try {
                console.close();
            } catch(Exception ex) {}
            System.exit(0);
        });
    }

    static void main(String[] args) {
        launch(args);
    }
}