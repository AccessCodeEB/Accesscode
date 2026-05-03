import { expect, test } from "@playwright/test"

const successToken = [
  "eyJhbGciOiJub25lIn0",
  "eyJpZEFkbWluIjo0MiwiaWRSb2wiOjIsIm5vbWJyZVJvbCI6IkFkbWluaXN0cmFkb3IiLCJub21icmVDb21wbGV0byI6Ikdlcm1hbiBUZXN0IiwiZW1haWwiOiJnZXJtYW4udGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0",
  "signature",
].join(".")

test.describe("Login de administradores", () => {
  test("escenario positivo: autenticar y entrar al panel", async ({ page }) => {
    await page.route("**/administradores/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: successToken,
          admin: {
            idAdmin: 42,
            idRol: 2,
            nombreRol: "Administrador",
            nombreCompleto: "German Test",
            email: "german.test@example.com",
            fotoPerfilUrl: null,
          },
        }),
      })
    })

    await page.goto("/panel")

    await page.locator("#login-email").fill("german.test@example.com")
    await page.locator("#login-password").fill("ClaveSegura123!")
    await page.getByRole("button", { name: "Iniciar sesión" }).click()

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByText("German Test")).toBeVisible()
    await expect(page.getByRole("button", { name: "Configurar cuenta" })).toBeVisible()
  })

  test("escenario negativo: credenciales inválidas", async ({ page }) => {
    await page.route("**/administradores/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Credenciales inválidas" }),
      })
    })

    await page.goto("/panel")

    await page.locator("#login-email").fill("german.test@example.com")
    await page.locator("#login-password").fill("ClaveIncorrecta123")
    await page.getByRole("button", { name: "Iniciar sesión" }).click()

    await expect(page.locator("#login-error")).toContainText("Credenciales inválidas")
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible()
  })
})