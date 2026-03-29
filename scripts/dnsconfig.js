// @ts-check
/// <reference path="./types-dnscontrol.d.ts"/>
// ^^^^^^ https://docs.dnscontrol.org/getting-started/typescript

var regNone = NewRegistrar("none");
var providerCf = DnsProvider(NewDnsProvider("cloudflare", "CLOUDFLAREAPI", {
  // manage_redirects: true,
}));

var rootDomain = 'fioo.org';
var proxy = {
  on: { "cloudflare_proxy": "on" },
  off: { "cloudflare_proxy": "off" }
}

function getDomainsList(filesPath) {
  // @ts-expect-error
  var files = glob.apply(null, [filesPath, true, '.json']);
  var result = [];

  for (var i = 0; i < files.length; i++) {
    var basename = files[i].split('/').reverse()[0];
    var name = basename.split('.').slice(0,-1).join('.');
    result.push({ name: name, data: require(files[i]) });
  }
  return result;
}

var domains = getDomainsList('../domains');
var commits = [];

for (var idx in domains) {
  var domainData = domains[idx].data;
  var subdomain = domains[idx].name;
  var proxyState = proxy.off;
  if (domainData.proxied === true) proxyState = proxy.on;

  if ('A' in domainData.record) {
    for (var a in domainData.record.A) {
      commits.push(
        A(subdomain, IP(domainData.record.A[a]), proxyState)
      );
    }
  }

  if ('AAAA' in domainData.record) {
    for (var aaaa in domainData.record.AAAA) {
      commits.push(
        AAAA(subdomain, domainData.record.AAAA[aaaa], proxyState)
      );
    }
  }

  if ('CNAME' in domainData.record) {
    commits.push(
      CNAME(subdomain, domainData.record.CNAME + ".", proxyState)
    );
  }

  if ('MX' in domainData.record) {
    for (var mx in domainData.record.MX) {
      commits.push(
        MX(subdomain, 10, domainData.record.MX[mx] + ".")
      );
    }
  }

  // if ('NS' in domainData.record) {
  //   for (var ns in domainData.record.NS) {
  //     commits.push(
  //       NS(subdomain, domainData.record.NS[ns] + ".")
  //     );
  //   }
  // }

    // Handle TXT records
    if (data.records.TXT) {
        if (Array.isArray(data.records.TXT)) {
            for (var txt in data.records.TXT) {
                records.push(TXT(subdomainName, data.records.TXT[txt].length <= 255 ? "\"" + data.records.TXT[txt] + "\"" : data.records.TXT[txt]));
            }
        } else {
            records.push(TXT(subdomainName, data.records.TXT.length <= 255 ? "\"" + data.records.TXT + "\"" : data.records.TXT));
        }
    }

    // Handle URL records
    if (data.records.URL) {
        records.push(A(subdomainName, IP("192.0.2.1"), CF_PROXY_ON));
    }
}

var reserved = require("./util/reserved.json");

// Handle reserved domains
for (var i = 0; i < reserved.length; i++) {
    var subdomainName = reserved[i];
    records.push(A(subdomainName, IP("192.0.2.1"), CF_PROXY_ON));
}

// Zone last updated TXT record
records.push(TXT("_zone-updated", "\"" + Date.now().toString() + "\""));

var ignored = [
    IGNORE("\\*", "A"),
    IGNORE("*._domainkey", "TXT"),
    IGNORE("@", "*"),
    IGNORE("_acme-challenge", "TXT"),
    IGNORE("_discord", "TXT"),
    IGNORE("_dmarc", "TXT"),
    IGNORE("_gh-zyrocfnd-o", "TXT"),
    IGNORE("_gh-zyrocfnd-o.**", "TXT"),
    IGNORE("_github-pages-challenge-zyrocfnd", "TXT"),
    IGNORE("_github-pages-challenge-zyrocfnd.**", "TXT"),
    IGNORE("_psl", "TXT"),
    IGNORE("ns[1-4]", "A,AAAA")
];

var internal = require("./util/internal.json");

internal.forEach(function(subdomain) {
    ignored.push(IGNORE(subdomain, "*"));
});

  // if ('CAA' in domainData.record) {
  //   for (var caa in domainData.record.CAA) {
  //     var caaRecord = domainData.record.CAA[caa];
  //     commits.push(
  //       CAA(subdomain, caaRecord.flags, caaRecord.tag, caaRecord.value)
  //     );
  //   }
  // }

  // if ('SRV' in domainData.record) {
  //   for (var srv in domainData.record.SRV) {
  //     var srvRecord = domainData.record.SRV[srv];
  //     commits.push(
  //       SRV(subdomain, srvRecord.priority, srvRecord.weight, srvRecord.port, srvRecord.target + ".")
  //     );
  //   }
  // }

  // if ('PTR' in domainData.record) {
  //   for (var ptr in domainData.record.PTR) {
  //     commits.push(
  //       PTR(subdomain, domainData.record.PTR[ptr] + ".")
  //     );
  //   }
  // }

  if ('ALIAS' in domainData.record) {
    commits.push(
      ALIAS(subdomain, domainData.record.ALIAS + ".", proxyState)
    );
  }
}

// commits.push();

D(rootDomain, regNone, providerCf, commits);
