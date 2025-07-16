package com.atify.backend.service; // Hangi klasördeyim

import com.atify.backend.dto.SanatciRequest;
import com.atify.backend.dto.SanatciResponse;
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


        return new SanatciResponse(kaydedilenSanatci.getId(), kaydedilenSanatci.getAd());   // DTO dışarı gösterilecek veri olarak geri döner
    }


    //Tüm sanatçıları getirmeye yarıyor alttaki kod


    public List<SanatciResponse> sanatcilariGetir() {               // Tüm sanatçıları al ve tek tek DTO'ya çevir
        return sanatciRepo.findAll().stream()
                .map(sanatci -> new SanatciResponse(sanatci.getId(), sanatci.getAd()))
                .collect(Collectors.toList());
    }
}
