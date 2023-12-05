/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee on NewBill Page", () => {
  test("Then the form NewBill appear", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;

    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
  });
  test("Then newbill icon in vertical layout should be highlighted", async () => {
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
    window.onNavigate(ROUTES_PATH.NewBill);
    await waitFor(() => screen.getByTestId("icon-mail"));
    const mailIcon = screen.getByTestId("icon-mail");
    //to-do write expect expression
    expect(mailIcon.classList.contains("active-icon")).toBe(true);
  });

  test("Then the file should be uploaded", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;
    const newBill = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    const handleChangeFile = jest.fn(newBill.handleChangeFile);
    const file = screen.getByTestId("file");
    file.addEventListener("change", handleChangeFile);
    fireEvent.change(file, {
      target: {
        files: [new File(["image.png"], "image.png", { type: "image/png" })],
      },
    });
    expect(handleChangeFile).toHaveBeenCalled();
    expect(file.files[0].name).toBe("image.png");
  });

  test("Then the form should be submitted", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;
    const newBill = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
    const handleSubmit = jest.fn(newBill.handleSubmit);
    const formNewBill = screen.getByTestId("form-new-bill");
    formNewBill.addEventListener("submit", handleSubmit);
    fireEvent.submit(formNewBill);
    expect(handleSubmit).toHaveBeenCalled();
  });

  test("should send a new bill with POST", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@company.tld",
      })
    );

    document.body.innerHTML = NewBillUI();

    const inputData = {
      type: "Hôtel et logement",
      name: "encore",
      amount: "400",
      date: "2004-04-04",
      vat: "80",
      pct: "20",
      commentary: "séminaire billed",
      fileUrl:
        "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
      fileName: "preview-facture-free-201801-pdf-1.jpg",
      status: "pending",
    };

    const inputType = screen.getByTestId("expense-type");
    fireEvent.change(inputType, { target: { value: inputData.type } });
    expect(inputType.value).toBe(inputData.type);

    const inputName = screen.getByTestId("expense-name");
    fireEvent.change(inputName, { target: { value: inputData.name } });
    expect(inputName.value).toBe(inputData.name);

    const inputDate = screen.getByTestId("datepicker");
    fireEvent.change(inputDate, { target: { value: inputData.date } });
    expect(inputDate.value).toBe(inputData.date);

    const inputAmount = screen.getByTestId("amount");
    fireEvent.change(inputAmount, { target: { value: inputData.amount } });
    expect(inputAmount.value).toBe(inputData.amount);

    const inputVat = screen.getByTestId("vat");
    fireEvent.change(inputVat, { target: { value: inputData.vat } });
    expect(inputVat.value).toBe(inputData.vat);

    const inputPct = screen.getByTestId("pct");
    fireEvent.change(inputPct, { target: { value: inputData.pct } });
    expect(inputPct.value).toBe(inputData.pct);

    const inputCommentary = screen.getByTestId("commentary");
    fireEvent.change(inputCommentary, {
      target: { value: inputData.commentary },
    });
    expect(inputCommentary.value).toBe(inputData.commentary);

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const store = null;

    const newBills = new NewBill({
      document,
      onNavigate,
      store,
      localStorage,
    });

    const getlocalStorage = localStorage.getItem("user");
    const localStorageparse = JSON.parse(getlocalStorage);
    const email = JSON.parse(localStorageparse).email;

    const mocked = mockStore.bills();
    const createBills = jest.spyOn(mocked, "create");

    const create = await createBills({ email, ...inputData });

    const formNewBill = screen.getByTestId("form-new-bill");
    const handleSubmit = jest.fn(newBills.handleSubmit);

    formNewBill.addEventListener("submit", handleSubmit);
    fireEvent.submit(formNewBill);

    expect(create).toEqual({
      fileUrl: "https://localhost:3456/images/test.jpg",
      key: "1234",
    });

    expect(handleSubmit).toHaveBeenCalled();
    expect(createBills).toHaveBeenCalled();
    expect(formNewBill).toBeTruthy();
  });

  describe("Testing API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Dashboard);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Dashboard);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
