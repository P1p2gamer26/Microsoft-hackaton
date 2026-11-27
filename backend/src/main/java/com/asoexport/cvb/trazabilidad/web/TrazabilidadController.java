package com.asoexport.cvb.trazabilidad.web;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.trazabilidad.service.EpcisService;
import com.asoexport.cvb.trazabilidad.service.TrazabilidadService;
import com.asoexport.cvb.trazabilidad.web.dto.EpcisDocumentDto;
import com.asoexport.cvb.trazabilidad.web.dto.EventoLoteDto;
import com.asoexport.cvb.trazabilidad.web.dto.FincaDto;
import com.asoexport.cvb.trazabilidad.web.dto.LoteDto;
import com.asoexport.cvb.trazabilidad.web.dto.NuevoEventoRequest;
import com.asoexport.cvb.trazabilidad.web.dto.NuevoLoteRequest;
import com.asoexport.cvb.trazabilidad.web.dto.ResumenEudrDto;
import com.asoexport.cvb.trazabilidad.web.dto.SyncRegistroDto;
import com.asoexport.cvb.trazabilidad.web.dto.SyncResultadoDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trazabilidad")
public class TrazabilidadController {

    private final TrazabilidadService trazabilidadService;
    private final EpcisService epcisService;
    private final ObjectMapper objectMapper;

    public TrazabilidadController(TrazabilidadService trazabilidadService, EpcisService epcisService,
                                  ObjectMapper objectMapper) {
        this.trazabilidadService = trazabilidadService;
        this.epcisService = epcisService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/fincas")
    @PreAuthorize("hasAnyAuthority('TRAZA_VIEW','EUDR_VIEW') or hasRole('GENERAL_ADMIN')")
    public List<FincaDto> listarFincas() {
        return trazabilidadService.listarFincas();
    }

    @GetMapping("/fincas/{codigo}")
    @PreAuthorize("hasAnyAuthority('TRAZA_VIEW','EUDR_VIEW') or hasRole('GENERAL_ADMIN')")
    public FincaDto obtenerFinca(@PathVariable String codigo) {
        return trazabilidadService.obtenerFinca(codigo);
    }

    @GetMapping("/lotes")
    @PreAuthorize("hasAnyAuthority('TRAZA_VIEW','EUDR_VIEW') or hasRole('GENERAL_ADMIN')")
    public List<LoteDto> listarLotes() {
        return trazabilidadService.listarLotes();
    }

    @GetMapping("/lotes/{codigo}")
    @PreAuthorize("hasAnyAuthority('TRAZA_VIEW','EUDR_VIEW') or hasRole('GENERAL_ADMIN')")
    public LoteDto obtenerLote(@PathVariable String codigo) {
        return trazabilidadService.obtenerLote(codigo);
    }

    @PostMapping("/lotes")
    @PreAuthorize("hasAuthority('TRAZA_EDIT') or hasRole('GENERAL_ADMIN')")
    public LoteDto crearLote(@RequestBody NuevoLoteRequest request) {
        return trazabilidadService.crearLote(request);
    }

    @PostMapping("/lotes/{codigo}/eventos")
    @PreAuthorize("hasAuthority('TRAZA_EDIT') or hasRole('GENERAL_ADMIN')")
    public EventoLoteDto agregarEvento(@PathVariable String codigo, @RequestBody NuevoEventoRequest request) {
        return trazabilidadService.agregarEvento(codigo, request);
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAuthority('TRAZA_SYNC') or hasRole('GENERAL_ADMIN')")
    public List<SyncResultadoDto> sincronizar(@RequestBody JsonNode body) {
        JsonNode registros = body.isArray() ? body : body.path("registros");
        if (!registros.isArray()) {
            throw new ApiException(400, "Se esperaba una lista de registros offline");
        }
        List<SyncRegistroDto> lista = objectMapper.convertValue(registros,
                new TypeReference<List<SyncRegistroDto>>() {
                });
        return trazabilidadService.sincronizar(lista);
    }

    @GetMapping("/lotes/{codigo}/epcis")
    @PreAuthorize("hasAnyAuthority('TRAZA_VIEW','EUDR_VIEW') or hasRole('GENERAL_ADMIN')")
    public EpcisDocumentDto epcis(@PathVariable String codigo) {
        return epcisService.documento(codigo);
    }

    @GetMapping("/resumen-eudr")
    @PreAuthorize("hasAuthority('EUDR_VIEW') or hasRole('GENERAL_ADMIN')")
    public ResumenEudrDto resumenEudr() {
        return trazabilidadService.resumenEudr();
    }
}
