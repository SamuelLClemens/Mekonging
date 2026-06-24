//
//  ContentView.swift
//  Mekonging
//
//  Hosts the bundled web app in a full-screen WKWebView. The app is served from the
//  "Web" folder reference over a private "mekong://" scheme (a stable origin that lets
//  localStorage / IndexedDB persist and lets relative asset paths resolve), so the
//  experience is identical to the web build but works entirely offline on-device.
//

import SwiftUI
import WebKit

// Private scheme used to serve the bundled web app. Must NOT be a standard scheme.
private let appScheme = "mekong"
private let appHost = "app"
private let webFolderName = "Web"   // folder reference added to the app target

// App background (matches the web --cream token) so safe-area strips look intentional.
private let creamUIColor = UIColor(red: 0.969, green: 0.918, blue: 0.816, alpha: 1)

struct ContentView: View {
    var body: some View {
        ZStack {
            Color(creamUIColor).ignoresSafeArea()
            WebView()
        }
    }
}

// MARK: - WKWebView host

struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(WebSchemeHandler(), forURLScheme: appScheme)
        config.websiteDataStore = .default()                 // persist localStorage + IndexedDB
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = [] // let text-to-speech audio play

        let pagePrefs = WKWebpagePreferences()
        pagePrefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = pagePrefs

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = creamUIColor
        webView.scrollView.backgroundColor = creamUIColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.bounces = true

        if let start = URL(string: "\(appScheme)://\(appHost)/index.html") {
            webView.load(URLRequest(url: start))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) { }
}

// MARK: - Bundled-asset scheme handler

/// Serves files from the bundled "Web" folder in response to mekong://app/<path>
/// requests. Reads happen off the main thread; callbacks are skipped if the task was
/// stopped (the documented way to avoid the "completed/stopped task" exception).
final class WebSchemeHandler: NSObject, WKURLSchemeHandler {
    private let queue = DispatchQueue(label: "mekong.web.scheme", qos: .userInitiated, attributes: .concurrent)
    private let lock = NSLock()
    private var stopped = Set<ObjectIdentifier>()

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        let id = ObjectIdentifier(task)
        lock.lock(); stopped.remove(id); lock.unlock()

        guard let requestURL = task.request.url else {
            task.didFailWithError(URLError(.badURL)); return
        }

        // mekong://app/<path>  ->  <bundle>/Web/<path> ; default to index.html.
        var relativePath = requestURL.path
        if relativePath.hasPrefix("/") { relativePath.removeFirst() }
        if relativePath.isEmpty { relativePath = "index.html" }

        queue.async { [weak self] in
            guard let self = self else { return }

            func isStopped() -> Bool {
                self.lock.lock(); defer { self.lock.unlock() }
                return self.stopped.contains(id)
            }

            guard let baseURL = Bundle.main.resourceURL?
                    .appendingPathComponent(webFolderName)
                    .standardizedFileURL else {
                if !isStopped() { task.didFailWithError(URLError(.fileDoesNotExist)) }
                return
            }

            let fileURL = baseURL.appendingPathComponent(relativePath).standardizedFileURL

            // Guard against path traversal outside the Web folder.
            guard fileURL.path.hasPrefix(baseURL.path),
                  let data = try? Data(contentsOf: fileURL) else {
                if !isStopped() {
                    let resp = HTTPURLResponse(url: requestURL, statusCode: 404,
                                               httpVersion: "HTTP/1.1", headerFields: nil)!
                    task.didReceive(resp)
                    task.didReceive(Data())
                    task.didFinish()
                }
                return
            }

            let headers = [
                "Content-Type": WebSchemeHandler.mimeType(forExtension: fileURL.pathExtension),
                "Content-Length": String(data.count),
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "*",
            ]
            let resp = HTTPURLResponse(url: requestURL, statusCode: 200,
                                       httpVersion: "HTTP/1.1", headerFields: headers)!

            if isStopped() { return }
            task.didReceive(resp)
            if isStopped() { return }
            task.didReceive(data)
            if isStopped() { return }
            task.didFinish()
        }
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
        lock.lock(); stopped.insert(ObjectIdentifier(task)); lock.unlock()
    }

    static func mimeType(forExtension ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm":     return "text/html; charset=utf-8"
        case "js", "mjs":       return "text/javascript; charset=utf-8"
        case "css":             return "text/css; charset=utf-8"
        case "json", "geojson": return "application/json; charset=utf-8"
        case "webmanifest":     return "application/manifest+json; charset=utf-8"
        case "svg":             return "image/svg+xml"
        case "png":             return "image/png"
        case "jpg", "jpeg":     return "image/jpeg"
        case "webp":            return "image/webp"
        case "gif":             return "image/gif"
        case "ico":             return "image/x-icon"
        case "woff2":           return "font/woff2"
        case "woff":            return "font/woff"
        case "ttf":             return "font/ttf"
        case "txt":             return "text/plain; charset=utf-8"
        default:                return "application/octet-stream"
        }
    }
}
