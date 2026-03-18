import dns from "dns";

// Use Google DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const domain = "_mongodb._tcp.cluster0.mu2to2e.mongodb.net";

dns.resolveSrv(domain, (err, addresses) => {
    if (err) {
        console.error("❌ DNS SRV Lookup Failed:");
        console.error(err);
    } else {
        console.log("✅ DNS SRV Records Found:");
        console.log(addresses);
    }
});