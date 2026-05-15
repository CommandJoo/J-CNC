plugins {
    java
    application
    id("org.openjfx.javafxplugin") version "0.1.0"
}

group = "de.johannes"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.fazecast:jSerialComm:2.10.4")
    implementation("org.openjfx:javafx-web:21.0.5")
    implementation("org.openjdk.nashorn:nashorn-core:15.4")
    implementation("me.friwi:jcefmaven:146.0.10")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

javafx {
    version = "21.0.5"
    modules = listOf(
        "javafx.controls",
        "javafx.web",
    )
}


application {
    mainClass.set("de.johannes.MainFX")
}

tasks.test {
    useJUnitPlatform()
}