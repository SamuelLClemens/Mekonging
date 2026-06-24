//
//  MekongingApp.swift
//  Mekonging
//
//  Mekonging ships the offline-first web app inside a thin WKWebView wrapper.
//  The bundled web assets live in the "Web" folder reference and are served over a
//  private URL scheme, so localStorage, IndexedDB (the document vault) and all
//  curated content work fully offline.
//

import SwiftUI

@main
struct MekongingApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
