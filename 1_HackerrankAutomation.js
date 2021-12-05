// node 1_HackerrankAutomation.js --url=https://www.hackerrank.com --cred=config.JSON

// npm install minimist
// npm init -y
// npm install puppeteer

let minimist = require("minimist");
let fs = require("fs");
let puppeteer = require("puppeteer");

let args = minimist(process.argv);
let configJSON = fs.readFileSync(args.cred, "utf-8");
let config = JSON.parse(configJSON);

async function init(){
    let browser = await puppeteer.launch({
        headless:false,
        args :[
                '--start-maximized'
        ],
        defaultViewport: null
    });  // Launch the browser
    let pages = await browser.pages(); //get pages of browser
    let page = pages[0];
    await page.goto(args.url); //give access of the url to 1st page
    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']", config.userid, {delay: 50}); 

    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']", config.password, {delay: 50}); 

    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']");

    // Click on compete
    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']");

    // Click on manage contest
    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']");

    // find number of pages
    await page.waitForSelector("a[data-attr1='Last']");
    let numPages = await page.$eval("a[data-attr1='Last']", function(atag){
        let noOfPages = parseInt(atag.getAttribute("data-page"));
        return noOfPages;
    });

    for(i=1;i<=numPages;i++)
    {
        await handleAllContestsOfAPage(page, browser);
        if(i!=numPages){
            await page.waitForSelector("a[data-attr1='Right']");
            await page.click("a[data-attr1='Right']");
        }
    }

async function handleAllContestsOfAPage(page,browser)
{
    // find all urls of same page
    await page.waitForSelector("a.backbone.block-center");
    let curls = await page.$$eval("a.backbone.block-center", function(atags){
        let urls = [];
        for(let i=0;i<atags.length;i++)
        {
            let url = atags[i].getAttribute("href");
            urls.push(url);
        }
        return urls;
    });
    
    for(let i=0;i<curls.length;i++)
    {
        let curl = curls[i];
        let ctab = await browser.newPage();
        await addModerator(ctab, args.url + curl, config.moderator);
        await ctab.close();
        await ctab.waitFor(1000);
    }

}

    
    async function addModerator(ctab, fullUrl, moderator)
    {
        await ctab.bringToFront();
        await ctab.goto(fullUrl);
        await ctab.waitFor(2000);

        // Click on save changes
        await ctab.waitForSelector("button.save-contest");
        await ctab.click("button.save-contest");
        await ctab.waitFor(4000);

        // click on moderators tab
        await ctab.waitForSelector("li[data-tab='moderators']");
        await ctab.click("li[data-tab='moderators']");
    
        // type in moderator
        await ctab.waitForSelector("input#moderator");
        await ctab.type("input#moderator", moderator, {delay:50});
        
        await ctab.keyboard.press("Enter");
        
    }

}
init();