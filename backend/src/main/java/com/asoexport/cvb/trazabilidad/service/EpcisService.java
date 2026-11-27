package com.asoexport.cvb.trazabilidad.service;

import com.asoexport.cvb.trazabilidad.domain.EventoLote;
import com.asoexport.cvb.trazabilidad.domain.LoteTrazable;
import com.asoexport.cvb.trazabilidad.web.dto.EpcisDocumentDto;
import com.asoexport.cvb.trazabilidad.web.dto.ObjectEventDto;
import com.asoexport.cvb.trazabilidad.web.dto.QuantityDto;
import com.asoexport.cvb.trazabilidad.web.dto.ReadPointDto;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EpcisService {

    private static final String EPC_CLASS_PREFIX = "urn:epc:class:lgtin:7709998.000001.";
    private static final String BIZ_STEP_PREFIX = "urn:epcglobal:cbv:bizstep:";
    private static final String EVENT_TIME_ZONE_OFFSET = "-05:00";

    private final TrazabilidadService trazabilidadService;

    public EpcisService(TrazabilidadService trazabilidadService) {
        this.trazabilidadService = trazabilidadService;
    }

    public EpcisDocumentDto documento(String codigoLote) {
        LoteTrazable lote = trazabilidadService.loteEntidad(codigoLote);
        List<ObjectEventDto> eventos = trazabilidadService.eventosDeLote(lote).stream()
                .map(evento -> toObjectEvent(lote, evento))
                .toList();
        return EpcisDocumentDto.de(eventos);
    }

    private ObjectEventDto toObjectEvent(LoteTrazable lote, EventoLote evento) {
        return new ObjectEventDto(
                "ObjectEvent",
                evento.getFecha().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                EVENT_TIME_ZONE_OFFSET,
                "OBSERVE",
                BIZ_STEP_PREFIX + evento.getEtapa().bizStep(),
                new ReadPointDto("geo:" + evento.getLat() + "," + evento.getLng()),
                List.of(new QuantityDto(EPC_CLASS_PREFIX + lote.getCodigo(), lote.getKg(), "KGM")),
                evento.getEtapa().wire(),
                evento.getLugar(),
                evento.getCanal().wire(),
                lote.getDestino()
        );
    }
}
