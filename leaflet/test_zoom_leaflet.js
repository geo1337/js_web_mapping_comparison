const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runTest() {
  let options = new chrome.Options();
  options.setLoggingPrefs({ browser: 'ALL' });

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get('C:/Users/Anwender/thesis_webapp/index_leaflet.html');

    await driver.wait(until.elementLocated(By.css('.leaflet-container')), 10000);
    let zoom_in = await driver.wait(until.elementLocated(By.css('a[aria-label="Zoom in"]')), 10000);
    let zoom_out = await driver.wait(until.elementLocated(By.css('a[aria-label="Zoom out"]')), 10000);

    let ms_sum = 0;
    let log_counter = 0; 

  
    for (let i = 0; i < 5; i++) {
      await zoom_in.click();
      await driver.sleep(1000);

      let logs = await driver.manage().logs().get('browser');
      logs.forEach(log => {
        if (log.message.includes('Millisekunden')) {
          let ms_regex = parseFloat(log.message.match(/\d+\.\d+/)[0]);
          ms_sum += ms_regex;
          log_counter++; 
        }
      });
    }

    console.log('Der "Vergrößern"-Button wurde fünfmal angeklickt.');

  
    for (let i = 0; i < 5; i++) {
      await zoom_out.click();
      await driver.sleep(1000);

      let logs = await driver.manage().logs().get('browser');
      logs.forEach(log => {
        if (log.message.includes('Millisekunden')) {
          let ms_regex = parseFloat(log.message.match(/\d+\.\d+/)[0]); 
          ms_sum += ms_regex;
          log_counter++; 
        }
      });
    }

    console.log('Der "Verkleinern"-Button wurde fünfmal angeklickt.');

    console.log('Durchschnittliche Ladezeit beim Zoomen:', (ms_sum / log_counter).toFixed(2), 'ms');
  } finally {
    await driver.quit();
  }
}

runTest().catch(console.error);
