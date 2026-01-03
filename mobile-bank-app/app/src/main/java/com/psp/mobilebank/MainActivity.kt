package com.psp.mobilebank

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.psp.mobilebank.databinding.ActivityMainBinding
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.POST
import retrofit2.http.Path

interface PspApiService {
    @POST("api/qr/simulate-pay/{id}")
    fun confirmPayment(@Path("id") transactionId: String): Call<Void>
}

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val BASE_URL = "http://192.168.0.114:8081/"
    private val TAG = "MobileBankDebug"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnScan.setOnClickListener {
            pokreniSkener()
        }
    }

    private fun pokreniSkener() {
        val options = ScanOptions()
        options.setDesiredBarcodeFormats(ScanOptions.QR_CODE)
        options.setPrompt("Skenirajte IPS QR kod")
        options.setBeepEnabled(true)
        options.setOrientationLocked(true)
        barcodeLauncher.launch(options)
    }

    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result ->
        if (result.contents == null) {
            Log.d(TAG, "Skeniranje otkazano od strane korisnika")
        } else {
            val scannedData = result.contents
            Log.d(TAG, "Skeniran IPS String: $scannedData")

            // Uzimamo ID koji je na samom kraju stringa (posle poslednjeg razmaka)
            val transactionId = scannedData.substringAfterLast(" ").trim()

            Log.d(TAG, "Izvučen ID za slanje: $transactionId")
            Log.d(TAG, "Kompletan URL: ${BASE_URL}api/qr/simulate-pay/$transactionId")

            binding.tvStatus.text = "Slanje potvrde za ID: $transactionId"
            posaljiPotvrduBackendu(transactionId)
        }
    }

    private fun posaljiPotvrduBackendu(id: String) {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(PspApiService::class.java)

        apiService.confirmPayment(id).enqueue(object : Callback<Void> {
            override fun onResponse(call: Call<Void>, response: Response<Void>) {
                Log.d(TAG, "Server odgovor: ${response.code()}")
                if (response.isSuccessful) {
                    binding.tvStatus.text = "✅ USPEŠNO!"
                    Toast.makeText(this@MainActivity, "Plaćeno!", Toast.LENGTH_SHORT).show()
                } else {
                    binding.tvStatus.text = "❌ Greška: ${response.code()}"
                    Log.e(TAG, "Greška 404 znači da ID $id ne postoji u bazi na portu 8081")
                }
            }

            override fun onFailure(call: Call<Void>, t: Throwable) {
                Log.e(TAG, "Mrežna greška: ${t.message}")
                binding.tvStatus.text = "❌ Mreža: ${t.message}"
            }
        })
    }
}