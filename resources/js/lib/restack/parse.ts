export function parseFromAPI(report: any) {
    const map = new Map();
    for (let i = 0; i < report['data']['categories'].length; i++) {
        let temp = [];
        // vulnerabilities
        for (let j = 0; j < report['data']['vulnerabilities'][i].length; j++) {
            temp[j] = report['data']['vulnerabilities'][i][j];
        }
        map.set(report['data']['categories'][i], {
            desc: report['data']['descriptions'][i],
            vuln: temp,
        });
        temp = [];
    }
    // Add WhatWeb results at the bottom
    if (report.plugins) {
        map.set('WhatWeb Results', {
            plugins: report.plugins
        });
    }
    return map;
}
