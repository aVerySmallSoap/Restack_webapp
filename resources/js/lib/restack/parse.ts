export function parseFromAPI(report:any){
    const map = new Map();
    for (let i = 0; i < report['categories'].length; i++) {
        let temp = [];
        //vulnerabilities
        for (let j = 0; j < report['vulnerabilities'][i].length; j++) {
            temp[j] = report['vulnerabilities'][i][j];
        }
        map.set(report['categories'][i], {
            desc: report['descriptions'][i],
            vuln: temp,
        });
        temp = [];
    }
    return map;
}
