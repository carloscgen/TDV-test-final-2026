const assert = require('node:assert/strict');
const { Builder, Browser } = require('selenium-webdriver');
const SwaggerUiPage = require('./swagger-ui-page');

// Operaciones que deben aparecer al abrir el YAML.
const expected = [
  'GET /user',
  'GET /user/repos',
  'POST /user/repos',
  'POST /repos/{owner}/{repo}/pulls',
  'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
].sort();

// Comprueba que Swagger UI muestre las cinco operaciones.
async function main() {
  const driver = await new Builder().forBrowser(Browser.CHROME).build();

  try {
    // Abre la página y compara métodos y rutas.
    const page = new SwaggerUiPage(driver);
    await page.open();
    await page.waitForOperations(expected.length);
    const actual = await page.getOperations();

    assert.deepEqual(actual.sort(), expected);
    console.log('Swagger UI muestra las cinco operaciones esperadas.');
  } finally {
    // Cierra Chrome incluso si falla la prueba.
    await driver.quit();
  }
}

// Muestra el motivo del error sin imprimir una traza extensa.
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
