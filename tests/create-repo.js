const assert = require('node:assert/strict');
const { Builder, Browser } = require('selenium-webdriver');
const SwaggerUiPage = require('./swagger-ui-page');

// El token llega desde Git Bash; no se guarda en el proyecto.
const token = process.env.GITHUB_TOKEN;

// Crea un repositorio privado y verifica lo que devuelve GitHub.
async function main() {
  if (!token) {
    throw new Error('Falta GITHUB_TOKEN en el entorno. No escribas el token en archivos del proyecto.');
  }

  // La fecha evita repetir un nombre ya usado.
  const repositoryName = `tdv-selenium-${new Date().toISOString().replace(/[-:TZ.]/g, '')}`;
  const requestBody = {
    name: repositoryName,
    description: 'Repositorio de prueba del TP de TDV creado mediante Selenium',
    private: true,
  };

  const driver = await new Builder().forBrowser(Browser.CHROME).build();
  try {
    // Abre Swagger UI y carga el token.
    const page = new SwaggerUiPage(driver);
    await page.open();
    await page.waitForOperations(5);
    await page.authorize(token);

    // Envía el JSON y compara la respuesta con los datos pedidos.
    const { status, body } = await page.executeRequest('POST', '/user/repos', requestBody);
    assert.equal(status, '201', `POST /user/repos respondió HTTP ${status} en lugar de 201.`);
    const repository = JSON.parse(body);
    assert.equal(repository.name, requestBody.name);
    assert.equal(repository.description, requestBody.description);
    assert.equal(repository.private, requestBody.private);
    assert.ok(/^https:\/\/github\.com\//.test(repository.html_url), 'La respuesta no contiene una URL de GitHub.');

    console.log(`Repositorio privado creado: ${repository.html_url}`);
    console.log('Verificá que aparezca en GitHub al abrir esa URL con tu sesión iniciada.');
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
