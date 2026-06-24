## GitHub Copilot Chat

- Extension: 0.37.9 (prod)
- VS Code: 1.109.5 (072586267e68ece9a47aa43f8c108e0dcbf44622)
- OS: win32 10.0.26100 x64
- GitHub Account: Satheesh521

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.207.73.85 (151 ms)
- DNS ipv6 Lookup: 64:ff9b::14cf:4955 (58 ms)
- Proxy URL: None (1 ms)
- Electron fetch (configured): Error (213 ms): Error: net::ERR_CERT_DATE_INVALID
	at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
	at SimpleURLLoaderWrapper.emit (node:events:519:28)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (403 ms): Error: certificate is not yet valid
	at TLSSocket.onConnectSecure (node:_tls_wrap:1679:34)
	at TLSSocket.emit (node:events:519:28)
	at TLSSocket._finishInit (node:_tls_wrap:1078:8)
	at ssl.onhandshakedone (node:_tls_wrap:864:12)
- Node.js fetch: Error (297 ms): TypeError: fetch failed
	at node:internal/deps/undici/undici:14900:13
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async n._fetch (c:\Users\ELCOT\.vscode\extensions\github.copilot-chat-0.37.9\dist\extension.js:4862:26129)
	at async n.fetch (c:\Users\ELCOT\.vscode\extensions\github.copilot-chat-0.37.9\dist\extension.js:4862:25777)
	at async u (c:\Users\ELCOT\.vscode\extensions\github.copilot-chat-0.37.9\dist\extension.js:4894:190)
	at async CA.h (file:///c:/Program%20Files/Microsoft%20VS%20Code/072586267e/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:116:41743)
  Error: certificate is not yet valid
  	at TLSSocket.onConnectSecure (node:_tls_wrap:1679:34)
  	at TLSSocket.emit (node:events:519:28)
  	at TLSSocket._finishInit (node:_tls_wrap:1078:8)
  	at ssl.onhandshakedone (node:_tls_wrap:864:12)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.113.22 (78 ms)
- DNS ipv6 Lookup: 64:ff9b::8c52:7215 (21 ms)
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (1593 ms)
- Node.js https: HTTP 200 (1726 ms)
- Node.js fetch: HTTP 200 (3449 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 4.225.11.192 (173 ms)
- DNS ipv6 Lookup: 64:ff9b::14c7:27e0 (63 ms)
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (807 ms)
- Node.js https: HTTP 200 (659 ms)
- Node.js fetch: HTTP 200 (971 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (423 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (757 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (1615 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (1634 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (598 ms)

Number of system certificates: 55

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).