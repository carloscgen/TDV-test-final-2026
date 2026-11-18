const { By } = require('selenium-webdriver');

class SwaggerUiPage {
  // Guarda el navegador que usan las pruebas.
  constructor(driver) {
    this.driver = driver;
  }

  // Abre la documentación local.
  async open() {
    await this.driver.get('http://localhost:3000');
  }

  // Espera a que Swagger UI termine de cargar las operaciones.
  async waitForOperations(count) {
    await this.driver.wait(
      async () => (await this.driver.findElements(By.css('.opblock'))).length === count,
      15000,
      `Swagger UI no mostró ${count} operaciones dentro de 15 segundos. Revisá que npm run swagger siga activo.`,
    );
  }

  // Lee el método y la ruta de cada operación visible.
  async getOperations() {
    const blocks = await this.driver.findElements(By.css('.opblock'));
    const operations = [];
    for (const block of blocks) {
      const method = await block.findElement(By.css('.opblock-summary-method')).getText();
      const route = await block.findElement(By.css('.opblock-summary-path')).getText();
      operations.push(`${method} ${route}`);
    }
    return operations;
  }

  // Ingresa el token en el cuadro Authorize.
  async authorize(token) {
    await this.driver.findElement(By.css('.scheme-container button.authorize')).click();
    const modal = await this.driver.findElement(By.css('.modal-ux'));
    await modal.findElement(By.css('.auth-container input')).sendKeys(token);
    await modal.findElement(By.css('.auth-btn-wrapper button.authorize')).click();
    await this.driver.wait(
      async () => (await modal.findElements(By.css('.auth-btn-wrapper button[aria-label="Remove authorization"]'))).length === 1,
      5000,
      'Swagger UI no confirmó la autorización.',
    );
    await modal.findElement(By.css('button.btn-done')).click();
  }

  // Espera un botón dentro de la operación y lo pulsa.
  async clickButton(block, selector, name) {
    const button = await this.driver.wait(async () => {
      const buttons = await block.findElements(By.css(selector));
      if (buttons.length === 0) return null;
      return (await buttons[0].isDisplayed()) ? buttons[0] : null;
    }, 10000, `No apareció el botón ${name}.`);
    await button.click();
  }

  // Busca la operación, envía la petición y devuelve su respuesta.
  async executeRequest(method, route, requestBody) {
    // Encuentra el bloque por método y ruta.
    const blocks = await this.driver.findElements(By.css('.opblock'));
    let operationBlock;
    for (const block of blocks) {
      const blockMethod = await block.findElement(By.css('.opblock-summary-method')).getText();
      const blockRoute = await block.findElement(By.css('.opblock-summary-path')).getText();
      if (blockMethod === method && blockRoute === route) {
        operationBlock = block;
        break;
      }
    }
    if (!operationBlock) {
      throw new Error(`No se encontró ${method} ${route} en Swagger UI.`);
    }

    // Abre la operación, completa el JSON si corresponde y pulsa Execute.
    if (!(await operationBlock.getAttribute('class')).includes('is-open')) {
      await operationBlock.findElement(By.css('.opblock-summary')).click();
    }
    await this.clickButton(operationBlock, 'button.try-out__btn', 'Try it out');
    if (requestBody !== undefined) {
      const input = await operationBlock.findElement(By.css('textarea.body-param__text'));
      await input.clear();
      await input.sendKeys(JSON.stringify(requestBody, null, 2));
    }
    await this.clickButton(operationBlock, 'button.execute', 'Execute');

    // Espera la respuesta y lee el estado y el cuerpo JSON.
    await this.driver.wait(
      async () => (await operationBlock.findElements(By.css('.live-responses-table tbody .response-col_status'))).length > 0,
      20000,
      'No llegó una respuesta HTTP. Revisá la conexión y la consola del navegador por posibles errores CORS.',
    );
    const statusText = (await operationBlock.findElement(By.css('.live-responses-table tbody .response-col_status')).getText()).trim();
    const status = statusText.match(/\b[1-5]\d{2}\b/)?.[0] || statusText;
    if (status.startsWith('2')) {
      await this.driver.wait(
        async () => (await operationBlock.findElements(By.css('.live-responses-table .response-col_description .highlight-code pre'))).length > 0,
        5000,
        'Swagger UI no mostró el cuerpo JSON de la respuesta.',
      );
    }
    const responseBodies = await operationBlock.findElements(By.css('.live-responses-table .response-col_description .highlight-code pre'));
    const body = responseBodies.length ? await responseBodies[0].getText() : '';
    return { status, body };
  }
}

module.exports = SwaggerUiPage;
