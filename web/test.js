const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3002'); // Adjust the URL if necessary

  // Perform checks
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Create a new page
  await page.waitForSelector('button[aria-label="New Page"]'); // Wait for the element to be visible
  const newPageButton = await page.$('button[aria-label="New Page"]');
  const isVisible = await newPageButton.boundingBox() !== null;
  console.log(`New Page button is visible: ${isVisible}`);
  await newPageButton.click(); // Adjust the selector if necessary
  await page.waitForSelector('input#page-title'); // Wait for the element to be visible
  await page.type('input#page-title', 'Test Page'); // Adjust the selector if necessary
  await page.waitForSelector('textarea#page-content'); // Wait for the element to be visible
  await page.type('textarea#page-content', 'This is a test page.'); // Adjust the selector if necessary
  await page.waitForSelector('button[aria-label="Save Page"]'); // Wait for the element to be visible
  const savePageButton = await page.$('button[aria-label="Save Page"]');
  const isSaveVisible = await savePageButton.boundingBox() !== null;
  console.log(`Save Page button is visible: ${isSaveVisible}`);
  await savePageButton.click(); // Adjust the selector if necessary

  // Check the contents are displayed
  await page.waitForSelector('div#page-content'); // Adjust the selector if necessary
  let content = await page.$eval('div#page-content', el => el.textContent); // Adjust the selector if necessary
  console.log(`Page content: ${content}`);

  // Edit the page
  await page.waitForSelector('button[aria-label="Edit page"]'); // Wait for the element to be visible
  const editPageButton = await page.$('button[aria-label="Edit page"]');
  const isEditVisible = await editPageButton.boundingBox() !== null;
  console.log(`Edit Page button is visible: ${isEditVisible}`);
  await editPageButton.click(); // Adjust the selector if necessary
  await page.waitForSelector('textarea#page-content'); // Wait for the element to be visible
  await page.type('textarea#page-content', ' Updated content.'); // Adjust the selector if necessary
  await page.waitForSelector('button[aria-label="Save Page"]'); // Wait for the element to be visible
  const savePageButton2 = await page.$('button[aria-label="Save Page"]');
  const isSaveVisible2 = await savePageButton2.boundingBox() !== null;
  console.log(`Save Page button is visible: ${isSaveVisible2}`);
  await savePageButton2.click(); // Adjust the selector if necessary

  // Check the contents are updated
  await page.waitForSelector('div#page-content'); // Adjust the selector if necessary
  content = await page.$eval('div#page-content', el => el.textContent); // Adjust the selector if necessary
  console.log(`Updated page content: ${content}`);

  await browser.close();
})();
