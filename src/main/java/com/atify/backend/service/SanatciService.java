package com.atify.backend.service; // Hangi klasördeyim
import com.atify.backend.dto.SanatciResponse;

import com.atify.backend.dto.SanatciRequest;
import com.atify.backend.entity.Sanatci;
import com.atify.backend.repository.SanatciRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service                                    // Servis sınıfı yazdığında bunla bunun servis sınıfı olduğunu anlıyor derleyici
public class SanatciService {


    private final SanatciRepository sanatciRepo;    // final tek kullanımlık sonra değiştirme diye Veritabanı ile iletişim kuruyorsun
    //burada public olarak da denicem bir kere burayı unutma!

    public SanatciService(SanatciRepository sanatciRepo) {            // Constructor (otomatik çalışır) → repository'yi bu sınıfa veriyor
        this.sanatciRepo = sanatciRepo;
    }

    // Yeni sanatçı ekleme bölümü altta ki

    public SanatciResponse sanatciEkle(SanatciRequest request) {


        boolean varMi = sanatciRepo.existsByAd(request.getAd());  // İsim tekrarı olmasın diye koydum bunu
        if (varMi) {
            throw new RuntimeException("Bu sanatçı zaten var.");   //fırlat metodunu ilk defa deniyorum hata çıkarsa buraya bak !!!!!!!!!
        }


        Sanatci yeniSanatci = new Sanatci();     // Yeni sanatçı nesnesi
        yeniSanatci.setAd(request.getAd());



        Sanatci kaydedilenSanatci = sanatciRepo.save(yeniSanatci);   // Veritabanına kaydetme komutu ezberledim bir tık bunu


        return new SanatciResponse(
                kaydedilenSanatci.getId(),
                kaydedilenSanatci.getAd(),
                kaydedilenSanatci.getUlke(),
                kaydedilenSanatci.getDogumTarihi(),
                kaydedilenSanatci.getBiyografi(),
                kaydedilenSanatci.getProfilResmiUrl()
        ); // ← DTO dışarı gösterilecek veri olarak geri döner
    }   // ← ✅ EKLENMESİ GEREKEN PARANTEZ BU!

    // DTO dışarı gösterilecek veri olarak geri döner



    //Tüm sanatçıları getirmeye yarıyor alttaki kod


    public List<SanatciResponse> sanatcilariGetir() {
        return sanatciRepo.findAll().stream()
                .map(sanatci -> new SanatciResponse(
                        sanatci.getId(),
                        sanatci.getAd(),
                        sanatci.getUlke(),
                        sanatci.getDogumTarihi(),
                        sanatci.getBiyografi(),
                        sanatci.getProfilResmiUrl()
                ))
                .collect(Collectors.toList());
    }


    public void sanatciSil(Long id) {
        boolean varMi = sanatciRepo.existsById(id);  // ID'li sanatçı var mı?
        if (!varMi) {
            throw new RuntimeException("Böyle bir sanatçı bulunamadı."); // Yoksa hata fırlat
        }

        sanatciRepo.deleteById(id); // varsa sil
    }
    public SanatciResponse sanatciGuncelle(Long id, SanatciRequest request) {
        Sanatci sanatci = sanatciRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek sanatçı bulunamadı."));

        // Güncelleme işlemleri
        sanatci.setAd(request.getAd());
        sanatci.setUlke(request.getUlke());
        sanatci.setDogumTarihi(request.getDogumTarihi());
        sanatci.setBiyografi(request.getBiyografi());
        sanatci.setProfilResmiUrl(request.getProfilResmiUrl());

        // Veritabanına kaydet
        Sanatci guncellenenSanatci = sanatciRepo.save(sanatci);

        return new SanatciResponse(
                guncellenenSanatci.getId(),
                guncellenenSanatci.getAd(),
                guncellenenSanatci.getUlke(),
                guncellenenSanatci.getDogumTarihi(),
                guncellenenSanatci.getBiyografi(),
                guncellenenSanatci.getProfilResmiUrl()
        );
    }


}