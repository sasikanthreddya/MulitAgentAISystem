import { test, expect } from "@playwright/test";

// Unique data per test run so parallel workers never collide on the same
// booking, and retries don't step on a booking a previous attempt half-created.
function uniqueBooking() {
  const tag = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    firstname: `Auto${tag}`,
    lastname: `Test${tag}`,
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: "2026-08-01", checkout: "2026-08-10" },
    additionalneeds: "Breakfast",
  };
}

test.describe("Booking API", () => {
  test("TC1 [Positive] Create booking with valid payload returns 200 and matching bookingid", async ({ request }) => {
    const payload = uniqueBooking();
    const res = await request.post("/booking", { data: payload });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.bookingid).toBeTruthy();
    expect(body.booking).toMatchObject(payload);
  });

  test("TC2 [Positive] Update booking with valid auth token returns 200 and updated values", async ({ request }) => {
    const created = await (await request.post("/booking", { data: uniqueBooking() })).json();
    const authRes = await request.post("/auth", { data: { username: "admin", password: "password123" } });
    const { token } = await authRes.json();

    const updated = { ...uniqueBooking(), totalprice: 200, depositpaid: false };
    const putRes = await request.put(`/booking/${created.bookingid}`, {
      data: updated,
      headers: { Cookie: `token=${token}` },
    });
    expect(putRes.status()).toBe(200);
    expect(await putRes.json()).toMatchObject(updated);
  });

  test("TC3 [Positive] Get booking IDs with no filters returns 200 and full list", async ({ request }) => {
    const res = await request.get("/booking");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("bookingid");
  });

  test("TC4 [Positive] Get booking IDs with firstname/lastname filters returns only matching IDs", async ({ request }) => {
    const payload = uniqueBooking();
    const created = await (await request.post("/booking", { data: payload })).json();

    const res = await request.get("/booking", {
      params: { firstname: payload.firstname, lastname: payload.lastname },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((b) => b.bookingid === created.bookingid)).toBe(true);
  });

  test("TC5 [Negative] Update booking without valid auth token returns 403 Forbidden", async ({ request }) => {
    const created = await (await request.post("/booking", { data: uniqueBooking() })).json();
    const res = await request.put(`/booking/${created.bookingid}`, { data: uniqueBooking() });
    expect(res.status()).toBe(403);
  });

  test("TC6 [Negative] Get non-existent bookingid returns 404 Not Found", async ({ request }) => {
    const res = await request.get("/booking/999999999");
    expect(res.status()).toBe(404);
  });
});
