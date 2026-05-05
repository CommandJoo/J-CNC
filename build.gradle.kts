plugins {
    id("java")
}

group = "de.johannes"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.fazecast:jSerialComm:2.10.4")
}

tasks.test {
    useJUnitPlatform()
}