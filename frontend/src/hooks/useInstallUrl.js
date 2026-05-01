import { useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

let cachedUrl = null;
let cachedPromise = null;

export default function useInstallUrl() {
  const [url, setUrl] = useState(cachedUrl);

  useEffect(() => {
    if (cachedUrl) {
      setUrl(cachedUrl);
      return;
    }
    if (!cachedPromise) {
      cachedPromise = axios
        .get(`${API}/install-url`)
        .then((r) => {
          cachedUrl = r.data.url || null;
          return cachedUrl;
        })
        .catch(() => null);
    }
    cachedPromise.then((u) => setUrl(u));
  }, []);

  return url;
}
