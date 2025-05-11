import http from "k6/http";
import { check, group, sleep } from "k6";
import {
  randomItem,
  randomIntBetween,
  // @ts-expect-error: k6-utils is a JS-only module, no TypeScript types available
} from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
// @ts-expect-error: k6-reporter is a JS-only module, no TypeScript types available
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
// @ts-expect-error: k6-summary is a JS-only module, no TypeScript types available
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { Counter, Trend } from "k6/metrics";
import exec from "k6/execution";

interface Animal {
  id?: string;
  name: string;
  createdAt: string;
  description: string;
}

interface SetupData {
  animals: Animal[];
}

const BASE_URL = "https://6820decb259dad2655adddab.mockapi.io/animals/animal";

const jsonHeaders = { headers: { "Content-Type": "application/json" } };

// Modifica getRandomNewAnimal para recibir el array de animales
function getRandomNewAnimal(animals: Animal[]): Animal {
  return randomItem(animals);
}

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "20s", target: 10 },
    { duration: "30s", target: 15 },
    { duration: "40s", target: 20 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(80)<900"],
  },
};

const createdAnimalIds: string[] = [];

const getAllSuccess = new Counter("get_all_success");
const getByIdSuccess = new Counter("get_by_id_success");
const createSuccess = new Counter("create_success");
const updateSuccess = new Counter("update_success");
const deleteSuccess = new Counter("delete_success");

const getAllErrors = new Counter("get_all_errors");
const getByIdErrors = new Counter("get_by_id_errors");
const createErrors = new Counter("create_errors");
const updateErrors = new Counter("update_errors");
const deleteErrors = new Counter("delete_errors");

const getAllTrend = new Trend("get_all_trend");
const getByIdTrend = new Trend("get_by_id_trend");
const createTrend = new Trend("create_trend");
const updateTrend = new Trend("update_trend");
const deleteTrend = new Trend("delete_trend");

export function setup(): SetupData {
  // Carga los datos de animales aquí
  const animals: Animal[] = JSON.parse(open("./animals.json"));
  // Valida el endpoint principal antes de correr el test
  const res = http.get(BASE_URL);
  if (res.error) {
    exec.test.abort(
      `Aborting test: API base endpoint ${BASE_URL} is not working properly`,
    );
  }
  return { animals };
}

export default function (data: SetupData) {
  // GET all animals (ids 1-50)
  group("Get all animals", function () {
    const resAll = http.get(BASE_URL, {
      tags: { method: "GET", endpoint: "all" },
    });
    getAllTrend.add(resAll.timings.duration);
    if (resAll.status === 200) {
      getAllSuccess.add(1);
    } else {
      getAllErrors.add(1);
    }
    check(resAll, { "status 200 when getting all": (r) => r.status === 200 });
  });

  // GET animal by random id (1-50)
  group("Get animal by ID", function () {
    const randomId = randomIntBetween(1, 50).toString();
    const resOne = http.get(`${BASE_URL}/${randomId}`, {
      tags: { method: "GET", endpoint: "byId" },
    });
    getByIdTrend.add(resOne.timings.duration);
    if (resOne.status === 200) {
      getByIdSuccess.add(1);
    } else {
      getByIdErrors.add(1);
    }
    check(resOne, { "status 200 when getting by ID": (r) => r.status === 200 });
  });

  // CREATE a new animal
  let createdAnimalId = "";
  group("Create a new animal", function () {
    // Usa los animales del setupData
    const newAnimal: Animal = getRandomNewAnimal(data.animals);
    const res = http.post(BASE_URL, JSON.stringify(newAnimal), {
      ...jsonHeaders,
      tags: { method: "POST", endpoint: "create" },
    });
    createTrend.add(res.timings.duration);
    if (res.status === 201) {
      createSuccess.add(1);
      try {
        const created = res.json() as unknown as Animal;
        if (created && created.id) {
          createdAnimalId = created.id;
          createdAnimalIds.push(created.id);
        }
      } catch {
        // ignore JSON parse errors
      }
    } else {
      createErrors.add(1);
    }
    check(res, { "created successfully": (r) => r.status === 201 });
    sleep(1);
  });

  // UPDATE the animal just created
  group("Update an existing animal", function () {
    if (!createdAnimalId) {
      return;
    }
    // Usa los animales del setupData
    const updated: Animal = getRandomNewAnimal(data.animals);
    const res = http.put(
      `${BASE_URL}/${createdAnimalId}`,
      JSON.stringify(updated),
      {
        ...jsonHeaders,
        tags: { method: "PUT", endpoint: "update" },
      },
    );
    updateTrend.add(res.timings.duration);
    if (res.status === 200) {
      updateSuccess.add(1);
    } else {
      updateErrors.add(1);
    }
    check(res, { "updated successfully": (r) => r.status === 200 });
    sleep(1);
  });

  // DELETE the animal just created
  group("Delete an animal", function () {
    if (!createdAnimalId) {
      return;
    }
    const res = http.del(`${BASE_URL}/${createdAnimalId}`, null, {
      tags: { method: "DELETE", endpoint: "delete" },
    });
    deleteTrend.add(res.timings.duration);
    if (res.status === 200 || res.status === 204) {
      deleteSuccess.add(1);
    } else {
      deleteErrors.add(1);
    }
    check(res, {
      "deleted successfully": (r) => r.status === 200 || r.status === 204,
    });
    sleep(1);
  });
}

export function teardown() {
  // Delete all animals created during the test
  for (const id of createdAnimalIds) {
    http.del(`${BASE_URL}/${id}`);
  }
}

export function handleSummary() {
  return {
    "report/index.html": htmlReport(__ENV, {
      title: `Animals API Load Test Report - ${new Date().toLocaleDateString()}`,
    }),
    stdout: textSummary(__ENV, { indent: " ", enableColors: true }),
  };
}
