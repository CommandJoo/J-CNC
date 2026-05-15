package de.johannes;

import me.friwi.jcefmaven.CefAppBuilder;
import me.friwi.jcefmaven.CefInitializationException;
import me.friwi.jcefmaven.MavenCefAppHandlerAdapter;
import me.friwi.jcefmaven.UnsupportedPlatformException;
import org.cef.CefApp;
import org.cef.CefClient;
import org.cef.browser.CefBrowser;

import javax.swing.*;
import javax.swing.plaf.ComponentUI;
import java.awt.*;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.io.IOException;

public class Main {



    public static void main(String[] args) throws UnsupportedPlatformException, CefInitializationException, IOException, InterruptedException {
        CefAppBuilder builder = new CefAppBuilder();
        builder.addJcefArgs(args);
        builder.addJcefArgs("--disable-pinch");
        builder.setInstallDir(new java.io.File("jcef-bundle"));

        builder.getCefSettings().windowless_rendering_enabled = false;

        builder.setAppHandler(new MavenCefAppHandlerAdapter() {
            @Override
            public void stateHasChanged(org.cef.CefApp.CefAppState state) {
                if (state == CefApp.CefAppState.TERMINATED) {
                    System.exit(0);
                }
            }
        });

        CefApp cefApp = builder.build();
        CefClient client = cefApp.createClient();

        CefBrowser browser = client.createBrowser(
                "http://localhost:5173",
                false,
                false
        );


        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("Laser CNC");
            frame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
            frame.setLayout(new BorderLayout());

            Component ui = browser.getUIComponent();

            ui.addKeyListener(new KeyAdapter() {
                @Override
                public void keyPressed(KeyEvent e) {
                    if (!e.isControlDown()) return;

                    switch (e.getKeyCode()) {
                        case KeyEvent.VK_PLUS:
                        case KeyEvent.VK_EQUALS:
                        case KeyEvent.VK_MINUS:
                        case KeyEvent.VK_0:
                            e.consume();
                            break;
                    }
                }
            });

            ui.addMouseWheelListener(e -> {
                if (e.isControlDown()) {
                    e.consume();
                }
            });

            frame.add(ui, BorderLayout.CENTER);
            frame.setSize(1920, 1080);
            frame.setLocationRelativeTo(null);
            frame.setVisible(true);
        });
    }
}
