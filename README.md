# TP final de Técnicas de Documentación y Validación

En [github-api.yaml](github-api.yaml) documenté cinco operaciones de la API de GitHub con OpenAPI 3.0. Swagger UI permite verlas y ejecutarlas desde el navegador. Los tests con Selenium interactúan con esa interfaz para comprobar la autenticación, el listado y la creación de repositorios.

## Requisitos

- Node.js 22 o superior y npm.
- Google Chrome.
- Git Bash para ejecutar los comandos de esta guía en Windows.

## Instalación

Cloná o descargá el repositorio, abrí Git Bash en la carpeta del proyecto e instalá las dependencias:

```bash
npm ci
```

Solo hace falta ejecutar `npm ci` una vez, o cuando cambien las dependencias.

## Terminal 1: abrir Swagger UI

Abrí una terminal de Git Bash en la carpeta del proyecto y ejecutá:

```bash
npm run swagger
```

Dejá esta terminal abierta. En <http://localhost:3000> deberías ver cinco operaciones en cuatro rutas: `GET /user`, `GET /user/repos`, `POST /user/repos`, `POST /repos/{owner}/{repo}/pulls` y `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`.

## Terminal 2: ejecutar los tests

Abrí otra terminal de Git Bash en la misma carpeta. Para comprobar que Swagger UI muestra las cinco operaciones:

```bash
npm run test:swagger
```

El resultado esperado es `Swagger UI muestra las cinco operaciones esperadas.` Este test no necesita token ni envía peticiones a GitHub.

### 1. Cargar el token para las pruebas de GitHub

En la terminal 2, ejecutá **solo esta línea primero**:

```bash
read -rs -p 'Token de GitHub: ' GITHUB_TOKEN
```

Cuando aparezca el mensaje, pegá únicamente el token, sin `Bearer`, y presioná Enter. Los caracteres no aparecen en pantalla. Después ejecutá:

```bash
printf '\n'
export GITHUB_TOKEN
```

Los scripts leen `GITHUB_TOKEN` de esta terminal y Swagger UI agrega el prefijo `Bearer`. No guardes el token en archivos del proyecto ni lo incluyas en capturas.

### 2. Probar autenticación

```bash
npm run test:user
```

Selenium carga el token con **Authorize**, ejecuta `GET /user` y comprueba HTTP `200`. Deberías ver `Autorización aplicada y GET /user respondió HTTP 200.`

### 3. Listar repositorios

```bash
npm run test:repos
```

La prueba ejecuta `GET /user/repos` y comprueba HTTP `200` y los campos `name`, `private` y `html_url` de cada repositorio. La salida indica cuántos repositorios encontró; no modifica nada.

### 4. Crear un repositorio de prueba

**Este comando crea un repositorio privado real** en la cuenta del token. El nombre comienza con `tdv-selenium-` y termina con la fecha y la hora para evitar repeticiones. Ejecutalo solo cuando quieras hacer esa prueba:

```bash
npm run test:create
```

La prueba comprueba HTTP `201`, nombre, descripción, visibilidad y URL. En la salida verás `Repositorio privado creado: https://github.com/...`. Abrí esa URL con tu sesión de GitHub para confirmar que existe. Antes de repetir el comando por un error, comprobá si llegó a crearse el repositorio.

Los tres tests usan [tests/swagger-ui-page.js](tests/swagger-ui-page.js) para abrir Swagger UI, encontrar los controles y leer las respuestas. Los tests conservan las comprobaciones de cada caso.

## Al terminar

En la terminal 2, borrá el token de esa sesión:

```bash
unset GITHUB_TOKEN
```

En la terminal 1, detené el servidor con `Ctrl+C`.

Si aparece `ERR_CONNECTION_REFUSED`, revisá que el servidor siga abierto en la terminal 1. Si Selenium muestra `Unable to obtain browser driver`, comprobá que Chrome esté instalado y que Selenium Manager pueda descargar ChromeDriver.
