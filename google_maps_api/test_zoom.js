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
    await driver.get('C:/Users/Anwender/thesis_webapp/index_normal.html');

    await driver.wait(until.elementLocated(By.css('body[data-tilesloaded="true"]')), 10000);

    let zoom_in = await driver.wait(until.elementLocated(By.css('button[aria-label="Vergrößern"]')), 10000);

    let zoom_out = await driver.wait(until.elementLocated(By.css('button[aria-label="Verkleinern"]')), 10000);

    let allMs = 0;


    for (let i = 0; i < 5; i++) {
      await zoom_in.click();
      await driver.sleep(1000);

      let logs = await driver.manage().logs().get('browser');
      
      logs.forEach(log => {
        if (log.message.includes('ms')) {
          let ms = parseFloat(log.message.match(/\d+\.\d+/)[0]); 
          allMs += ms;
        }
      });
    }

    console.log('Der Vergrößern-Button wurde fünfmal angeklickt.');

   
    for (let i = 0; i < 5; i++) {

      await zoom_out.click();

      await driver.sleep(1000);


      let logs = await driver.manage().logs().get('browser');

      logs.forEach(log => {

        if (log.message.includes('ms')) {

          let ms = parseFloat(log.message.match(/\d+\.\d+/)[0]); 
          allMs += ms;
        }
      });
    }

    console.log('Der Verkleinern-Button wurde fünfmal angeklickt.');

    console.log('Durchschnittliche Ladezeit beim Zoomen:', (allMs / 10).toFixed(2), 'ms');

  } finally {

    //await driver.quit();
  }
}

runTest()
