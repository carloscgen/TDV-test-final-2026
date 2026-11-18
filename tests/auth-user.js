const assert = require('node:assert/strict');
const { Builder, Browser } = require('selenium-webdriver');
const SwaggerUiPage = require('./swagger-ui-page');

// El token llega desde Git Bash; no se guarda en el proyecto.
const token = process.env.GITHUB_TOKEN;

// Autoriza en Swagger UI y comprueba GET /user.
async function main() {
  if (!token) {
    throw new Error('Falta GITHUB_TOKEN en el entorno. No escribas el token en archivos del proyecto.');
  }

  const driver = await new Builder().forBrowser(Browser.CHROME).build();

  try {
    // Abre Swagger UI y carga el token.
    const page = new SwaggerUiPage(driver);
    await page.open();
    await page.waitForOperations(5);
    await page.authorize(token);

    // Ejecuta la petición y revisa el estado HTTP.
    const { status } = await page.executeRequest('GET', '/user');
    assert.equal(status, '200', `GET /user respondió HTTP ${status} en lugar de 200.`);
    console.log('Autorización aplicada y GET /user respondió HTTP 200.');
  } finally {
    // Cierra Chrome incluso si falla la prueba.
    await driver.quit();
  }
}

// Evita mostrar el token si aparece en un mensaje de error.
main().catch((error) => {
  console.error(token ? error.message.replaceAll(token, '[REDACTED]') : error.message);
  process.exitCode = 1;
});
