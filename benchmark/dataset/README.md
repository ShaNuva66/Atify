# Benchmark Dataset

Bu klasör tez için tanýma baþarýmýný ölçmek üzere kullanýlýr.

## Yapý
- `clean/`: gürültüsüz örnekler
- `noise_10/`: ~10 dB SNR
- `noise_20/`: ~20 dB SNR
- `noise_30/`: ~30 dB SNR
- `manifest.csv`: etiket dosyasý

## manifest.csv formatý
`clip_path,expected_song_name,expected_song_code,noise_level`

Örnek:
`clean/song_a_01.wav,Song A,song_a_fp,clean`

## Not
- `clip_path` dataset klasörüne göre relatif olmalý.
- `expected_song_code` backend'de `fingerprint_code` ile eþleþen deðer olmalý.
