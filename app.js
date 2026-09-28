const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
  const kota = (req.query.kota || "").trim();

  const apiKey = "vWXPrudoV4tnwNqYPVkL";

  if (!kota) {
    return res.status(400).json({ message: "Lokasi wajib diisi" });
  }

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}`;

  try {
    const response = await axios.get(url);

    const features = response.data.features;

    if (!features || features.length === 0) {
      return res.status(404).json({ message: "Lokasi tidak ditemukan" });
    }

    const f = features[0];
    const konteks = f.context || [];
    const tipeUtama = f.place_type ? f.place_type[0] : "";

    const ambil = (prefixes) => {
      const item = konteks.find((c) =>
        prefixes.some((p) => c.id.startsWith(p)),
      );
      return item ? item.text : null;
    };

    const tipeKecamatan = [
      "municipal_district",
      "municipality",
      "county",
      "subregion",
      "locality",
    ];

    const negara =
      ambil(["country"]) || (tipeUtama === "country" ? f.text : "-");
    const provinsi =
      ambil(["region"]) || (tipeUtama === "region" ? f.text : "-");
    const kecamatan =
      ambil(tipeKecamatan) ||
      (tipeKecamatan.includes(tipeUtama) ? f.text : "-");

    res.json({
      lokasi: f.place_name,
      negara: negara,
      provinsi: provinsi,
      kecamatan: kecamatan,
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Gagal mengambil data dari MapTiler",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
