const { Builder, By } = require('selenium-webdriver');

(async function countIds() {
   
    let driver = await new Builder().forBrowser('chrome').build();

    try {
     
        await driver.get('https://leafletjs.com/reference.html');

      
        let elemnts = await driver.findElements(By.css('[id]'));

       
        let counter = elemnts.length;
        console.log(`Anzahl: ${counter}`);
    } finally {
        
        await driver.quit();
    }
})();