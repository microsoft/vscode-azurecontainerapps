package main

import (
	"album-service/controllers/album"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {

	// router implementation
	router := mux.NewRouter()

	// adding cors
	c := cors.AllowAll()
	handler := c.Handler(router)

	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = "8080"
	}

	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Access /albums to see the list of albums")
	})

	router.HandleFunc("/albums", album.Get).Methods("GET")

	// listen and serve
	log.Printf("will listen on %v\n", port)
	if err := http.ListenAndServe(":" + port, trailingSlashHandler(handler)); err != nil {
		log.Fatalf("unable to start http server, %s", err)
	}
}

func trailingSlashHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			r.URL.Path = strings.TrimSuffix(r.URL.Path, "/")
		}
		next.ServeHTTP(w, r)
	})
}
