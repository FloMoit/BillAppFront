/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({
        data: bills.sort((a, b) => (a.date < b.date ? 1 : -1)),
      });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When I click on the icon eye", () => {
      test("A modal should open", () => {
        //Mocking de la fonction modal de jQuery/Bootstrap
        $.fn.modal = jest.fn();

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        document.body.innerHTML = BillsUI({ data: bills });

        const store = null;
        const myBills = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        const iconEye = screen.getAllByTestId("icon-eye")[0];

        const handleClickIconEye = jest.fn(() =>
          myBills.handleClickIconEye(iconEye)
        );

        iconEye.addEventListener("click", handleClickIconEye);
        userEvent.click(iconEye);
        expect(handleClickIconEye).toHaveBeenCalledTimes(1);

        const modale = screen.getByTestId("modaleFileEmploye");
        expect(modale).toBeTruthy();
      });
    });

    describe("When I am on Bills page but it is loading", () => {
      test("Then, Loading page should be rendered", () => {
        document.body.innerHTML = BillsUI({ loading: true });
        expect(screen.getAllByText("Loading...")).toBeTruthy();
      });
    });

    describe("When I am on Bills page but back-end send an error message", () => {
      test("Then, Error page should be rendered", () => {
        document.body.innerHTML = BillsUI({ error: "some error message" });
        expect(screen.getAllByText("Erreur")).toBeTruthy();
      });
    });
  });
});
