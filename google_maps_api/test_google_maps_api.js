const { Builder } = require('selenium-webdriver');
const { exec } = require('child_process');
const chrome = require('selenium-webdriver/chrome');
const edge = require('selenium-webdriver/edge');
const fs = require('fs');
const os = require('os');
const pidusage = require('pidusage');
const xmlJs = require('xml-js');
const { createObjectCsvWriter } = require('csv-writer');

const browsers = ['chrome', 'MicrosoftEdge'];

const my_file = './results_no_cache.csv';



if (fs.existsSync(my_file)) {
    fs.truncateSync(my_file, 0);
}


async function measurements(driver, url) {

    let CPU_on_start, RAM_on_start;

    try {
      
        CPU_on_start = await get_cpu_usage();
        RAM_on_start = os.freemem() / 1024 / 1024

        const start_time = Date.now(); 

        await driver.get(url);

        
      
       
        const gpu_on_pageload = await get_gpu_stats();

        const num_reqeusts = await count_network_req(driver);

        const duration = await measure_time_for_tilesloaded(driver, start_time);

        
        const RAM_on_end = os.freemem() / 1024 / 1024;  // MB

        const CPU_on_end = await get_cpu_usage();

        const CPU_usage = CPU_on_end - CPU_on_start;

        const RAM_usage = RAM_on_start - RAM_on_end;

    
        const GPU_stats_after_tilesloaded = await get_gpu_stats();

      
        const logs = await log_ressources(driver);

      
        const latency_logs = await measure_latency(driver);

        const sum_latency = latency_logs.reduce((sum, log) => sum + log.latency, 0);

        const avg_latency = sum_latency / latency_logs.length;

        //console.log("Start CPU-Nutzung:", CPU_on_start);
        
        //console.log("Ende CPU-Nutzung:", CPU_on_end);

        return { duration, cpuUsageDiff: CPU_usage, memoryUsageDiff: RAM_usage, numRequests: num_reqeusts, averageLatency: avg_latency, gpuStatsPageLoad: gpu_on_pageload, gpuStatsTilesLoaded: GPU_stats_after_tilesloaded };
        
    } catch (error) {
        console.error(`Fehler beim Aufrufen der: ${url}:`, error);
        return null;
    }
}


// CPU 

async function get_cpu_usage() {
    return new Promise((resolve, reject) => {
        exec('wmic cpu get loadpercentage', (error, stdout, stderr) => {
            if (error) {
                reject(`Fehler beim Ausführen des Befehls: ${error}`);
                return;
            }
            if (stderr) {
                reject(`Abgelehnt / Zugriff verweigert: ${stderr}`);
                return;
            }

            const CPU_usage_percentage = parseFloat(stdout.split('\n')[1]);

            resolve(CPU_usage_percentage);
        });
    });
}

// GPU 

async function get_gpu_stats() {
    return new Promise((resolve, reject) => {

        exec('nvidia-smi --query-gpu=temperature.gpu,utilization.gpu --format=csv,noheader', (error, stdout, stderr) => {
            if (error) {
                reject(`Fehler beim Ausführen des Befehls: ${error}`);
                return;
            }
            if (stderr) {
                reject(`Abgelehnt / Zugriff verweigert: ${stderr}`);
                return;
            }

            const [temperature, usage_percantage] = stdout.trim().split(',');

            resolve({ temperature, utilization: usage_percantage });
        });
    });
}

// Tilesload

async function measure_time_for_tilesloaded(driver, start_time_2) {
    await wait_for_tilesloaded(driver);
    const end_time = Date.now();
    return end_time - start_time_2;
}


// Tilesload

async function wait_for_tilesloaded(driver) {
    await driver.executeScript(() => {
        return new Promise((resolve) => {
            google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
                resolve(true);
            });
        });
    });
}


// Logs

async function count_network_req(driver) {

    const performance = await driver.executeScript(`
    const entries = window.performance.getEntriesByType('resource');
    const googleMapsEntries = entries.filter(entry => entry.name.includes('maps.googleapis.com'));
    return googleMapsEntries.length;
`);

    return performance;
}

// Logs 

async function log_ressources(driver) {
    const resourceLogs = await driver.executeScript(`
        return window.performance.getEntriesByType('resource').map(entry => ({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            initiatorType: entry.initiatorType,
            nextHopProtocol: entry.nextHopProtocol,
            redirectStart: entry.redirectStart,
            redirectEnd: entry.redirectEnd,
            fetchStart: entry.fetchStart,
            domainLookupStart: entry.domainLookupStart,
            domainLookupEnd: entry.domainLookupEnd,
            connectStart: entry.connectStart,
            connectEnd: entry.connectEnd,
            secureConnectionStart: entry.secureConnectionStart,
            requestStart: entry.requestStart,
            responseStart: entry.responseStart,
            responseEnd: entry.responseEnd
        }));
    `);

    return resourceLogs;
}

async function measure_latency(driver) {
    const latency_logs = await driver.executeScript(`
        const entries = window.performance.getEntriesByType('resource');
        return entries.filter(entry => entry.name.includes('maps.googleapis.com')).map(entry => ({
            name: entry.name,
            latency: entry.responseEnd - entry.fetchStart // Calculate latency
        }));
    `);
    //console.log('Latency Logs:', latency_logs); 
    return latency_logs;
}


async function open_chrome(url_2) {
    const options = new chrome.Options();
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await driver.get(url_2);
        //await driver.quit();
    } catch (error) {
        console.error(error);
    }
}


async function action_after_tests() {
    try {
        const url_2 = 'http://localhost/index.html'; 

        await open_chrome(url_2);



        console.log(`Browser geöffnet und zur URL ${url_2} navigiert` );
    } catch (error) {
        console.error(error);
    }
}



async function run_tests(req_per_browser) {

    const csv_writer = createObjectCsvWriter({
        path:  'results_no_cache.csv',
        header: [
            { id: 'test', title: 'Testart' },
            { id: 'browser', title: 'Browser' },
            { id: 'loadtime', title: 'Ladezeit (ms)' },
            { id: 'cpuusage', title: 'CPU-Nutzung (%)' },
            { id: 'memoryusage', title: 'Ramverbrauch (MB)' },
            { id: 'numreq', title: 'Anfragen' },
            { id: 'avglatency', title: 'Durchschnittliche Latenz (ms)' },
            { id: 'gputempafterpageload', title: 'GPU nach dem Laden der Seite: Temperatur' },
            { id: 'gpuusageafterpageload', title: 'GPU nach dem Laden der Seite: %-Nutzung' },
            { id: 'gputempaftertilesloaded', title: 'GPU nach Tiles loaded: Temperatur' },
            { id: 'gpuusageaftertilesloaded', title: 'GPU nach Tiles loaded: %-Nutzung' }
        ]
    });

    const data = [];

    const urls = [
        'file:///C:/Users/Anwender/thesis_webapp/index_normal.html',
        'file:///C:/Users/Anwender/thesis_webapp/index_2.html'
    ];

    for (let browserIndex = 0; browserIndex < browsers.length; browserIndex++) {

        const browser = browsers[browserIndex];

        console.log(`Teste die Ladezeit in ${browser}`);

        try {
         
            let is_first_url = true;

            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                if (!is_first_url) {
                    console.log('Warte 10 Sekunden vor der nächsten URL....');
                    await new Promise(resolve => setTimeout(resolve, 10000)); 
                } else {
                    is_first_url = false;
                }

                let total_load_time = 0;
                let total_num_req = 0;
                let total_cpu_usage = 0;
                let total_ram_usage = 0;
                let total_avg_latency = 0;
                let total_gpu_temp_after_pagload = 0;
                let total_gpu_usage_after_pageload = 0;
                let total_gpu_temp_after_tilesloaded = 0;
                let total_gpu_usage_after_tilesloaded = 0;

                for (let j = 0; j < req_per_browser; j++) {
                    let driver;
                    try {
                        let options;
                        switch (browser) {
                            case 'chrome':
                                options = new chrome.Options();
                               
                                    options.addArguments("--disable-cache", "--disable-application-cache");
                              
                                break;
                            case 'MicrosoftEdge':
                                options = new edge.Options().setPageLoadStrategy('eager');
                                break;
                             case 'firefox':
                                
                             
                             break;
                            default:
                                throw new Error(`Unsupported browser: ${browser}`);
                        }

                        driver = await new Builder().forBrowser(browser).setChromeOptions(options).build();

                        const results = await measurements(driver, url);
                        if (results) {
                            const { duration, cpuUsageDiff, memoryUsageDiff, numRequests, averageLatency, gpuStatsPageLoad, gpuStatsTilesLoaded } = results;

                            total_load_time += duration;
                            total_num_req += numRequests;
                            total_cpu_usage += cpuUsageDiff;
                            total_ram_usage += memoryUsageDiff;
                            total_avg_latency += averageLatency;
                            total_gpu_temp_after_pagload += gpuStatsPageLoad.temperature;
                            total_gpu_usage_after_pageload += gpuStatsPageLoad.utilization;
                            total_gpu_temp_after_tilesloaded += gpuStatsTilesLoaded.temperature;
                            total_gpu_usage_after_tilesloaded += gpuStatsTilesLoaded.utilization;

                            data.push({
                                test: url.includes('normal') ? 'Normal' : 'Stresstest',
                                browser: browser,
                                loadtime: duration,
                                cpuusage: cpuUsageDiff.toFixed(2),
                                memoryusage: memoryUsageDiff.toFixed(2),
                                numreq: numRequests,
                                avglatency: averageLatency.toFixed(2),
                                gputempafterpageload: gpuStatsPageLoad.temperature,
                                gpuusageafterpageload: gpuStatsPageLoad.utilization,
                                gputempaftertilesloaded: gpuStatsTilesLoaded.temperature,
                                gpuusageaftertilesloaded: gpuStatsTilesLoaded.utilization
                            });

                            if (j < req_per_browser - 1) {
                                console.log('Warte 10 Sekunden vor der nächsten Anfrage...');
                                await new Promise(resolve => setTimeout(resolve, 10000)); 
                            }
                        }
                    } catch (error) {
                        console.error(`Fehler in ${browser} mit ${url}:`, error);
                    } finally {
                        if (driver) {
                            await driver.quit();
                        }
                    }
                }

               // AVG

                const avg_load_time = total_load_time / req_per_browser;
                const avg_num_req = total_num_req / req_per_browser;
                const avg_cpu_usage = total_cpu_usage / req_per_browser;
                const avg_ram_usage = total_ram_usage / req_per_browser;
                const avg_latency_usage = total_avg_latency / req_per_browser;
                const avg_gpu_temp_1 = total_gpu_temp_after_pagload / req_per_browser;
                const avg_gpu_usage_1 = total_gpu_usage_after_pageload / req_per_browser;
                const avg_gpu_temp_2 = total_gpu_temp_after_tilesloaded / req_per_browser;
                const avg_gpu_usage_2 = total_gpu_usage_after_tilesloaded / req_per_browser;

                data.push({
                    test: url.includes('normal') ? 'Durchschnitt Normalfall' : 'Durchschnitt Stresstest',
                    browser: browser,
                    loadtime: avg_load_time.toFixed(2),
                    cpuusage: avg_cpu_usage.toFixed(2),
                    memoryusage: avg_ram_usage.toFixed(2),
                    numreq: avg_num_req.toFixed(2),
                    avglatency: avg_latency_usage.toFixed(2),
                    gputempafterpageload: avg_gpu_temp_1.toFixed(2),
                    gpuusageafterpageload: avg_gpu_usage_1.toFixed(2),
                    gputempaftertilesloaded: avg_gpu_temp_2.toFixed(2),
                    gpuusageaftertilesloaded: avg_gpu_usage_2.toFixed(2)
                });
                

            }

            if (browserIndex < browsers.length - 1) {

                console.log('Warte 10 Sekunden vor dem Browserwechsel');

                await new Promise(resolve => setTimeout(resolve, 10000)); 
            }

        } catch (error) {
            console.error(`Fehler in ${browser}:`, error);
        }
    }

    try {
        await csv_writer.writeRecords(data);

        console.log('CSV wurde geschrieben');
        
    } catch (error) {

        console.error(error);
    }
}



(async () => {

    const requestsPerBrowser = 3;
    await run_tests(requestsPerBrowser, true); 




    await action_after_tests();

})();
