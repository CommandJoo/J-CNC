import java.util.Properties

plugins {
    java
    application
    id("org.openjfx.javafxplugin") version("0.1.0")
    id("com.gradleup.shadow") version("9.4.1")
}

group = "de.johannes"

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

fun runCommand(vararg command: String) {
    val result = ProcessBuilder(*command)
        .directory(rootDir)
        .inheritIO()
        .start()
        .waitFor()

    if (result != 0) {
        throw GradleException("Command failed: ${command.joinToString(" ")}")
    }
}



tasks.jar {
    manifest {
        attributes["Main-Class"] = "de.johannes.MainFX"
    }
}

tasks.shadowJar {
    archiveClassifier.set("")
    manifest {
        attributes["Main-Class"] = "de.johannes.MainFX"
    }
}

tasks.register("bumpPatchVersion") {
    doLast {
        val propsFile = file("gradle.properties")
        val lines = propsFile.readLines().toMutableList()

        val versionIndex = lines.indexOfFirst { it.startsWith("version=") }

        if (versionIndex == -1) {
            throw GradleException("No version property found in gradle.properties")
        }

        val currentVersion = lines[versionIndex].removePrefix("version=")
        val parts = currentVersion.split(".")

        if (parts.size != 3) {
            throw GradleException("Version must be in format MAJOR.MINOR.PATCH")
        }

        val major = parts[0].toInt()
        val minor = parts[1].toInt()
        val patch = parts[2].toInt() + 1

        val newVersion = "$major.$minor.$patch"

        lines[versionIndex] = "version=$newVersion"
        propsFile.writeText(lines.joinToString("\n") + "\n")

        println("Version bumped: $currentVersion -> $newVersion")
    }
}

tasks.register("releaseVersion") {
    dependsOn("bumpPatchVersion")

    doLast {
        val props = Properties()

        file("gradle.properties").inputStream().use {
            props.load(it)
        }

        val newVersion = props.getProperty("version")
            ?: throw GradleException("No version property found")

        runCommand("git", "add", "gradle.properties")
//        runCommand("git", "commit", "-m", "Release $newVersion")
//        runCommand("git", "push", "origin", "main")
        runCommand("git", "tag", newVersion)
        runCommand("git", "push", "origin", newVersion)

        println("Released v$newVersion")
    }
}

tasks.test {
    useJUnitPlatform()
}