const assert = require('node:assert/strict');
const { Builder, Browser } = require('selenium-webdriver');
const SwaggerUiPage = require('./swagger-ui-page');

// El token llega desde Git Bash; no se guarda en el proyecto.
const token = process.env.GITHUB_TOKEN;

// Pide los repositorios y comprueba los datos de la respuesta.
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

    // Ejecuta GET /user/repos y revisa cada repositorio.
    const { status, body } = await page.executeRequest('GET', '/user/repos');
    assert.equal(status, '200', `GET /user/repos respondió HTTP ${status} en lugar de 200.`);
    const repositories = JSON.parse(body);
    assert.ok(Array.isArray(repositories), 'La respuesta de repositorios no es una lista.');
    for (const repository of repositories) {
      assert.equal(typeof repository.name, 'string', 'Falta el nombre de un repositorio.');
      assert.equal(typeof repository.private, 'boolean', 'Falta la visibilidad de un repositorio.');
      assert.ok(/^https:\/\/github\.com\//.test(repository.html_url), 'Falta la URL de GitHub de un repositorio.');
    }
    console.log(`GET /user/repos respondió HTTP 200 con ${repositories.length} repositorios y los campos esperados.`);
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
